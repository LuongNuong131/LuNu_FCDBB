import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { FcdbbModule } from '../src/fcdbb/fcdbb.module';
import {
  Attendance,
  BlogPost,
  Fund,
  Match,
  User,
} from '../src/fcdbb/entities/fcdbb.entity';
import { ClubManagement1794900000000 } from '../src/migrations/1794900000000-ClubManagement';

describe('Club management: real SQLite database and authenticated HTTP API', () => {
  let app: INestApplication;
  let db: DataSource;
  let admin: string,
    member: string,
    a: number,
    b: number,
    season: number,
    match: number;
  const auth = () => ({ Authorization: `Bearer ${admin}` });
  const memberAuth = () => ({ Authorization: `Bearer ${member}` });
  const past = {
    title: 'Nội bộ A/B',
    location_name: 'Sân Thống Nhất',
    lat: 10.78,
    lng: 106.67,
    start_time: '2026-01-10T18:00:00+07:00',
    lock_time: '2026-01-10T18:15:00+07:00',
    end_time: '2026-01-10T20:00:00+07:00',
  };
  const report = (extra = {}) => ({
    revision: 0,
    season_id: season,
    status: 'completed',
    score_a: 1,
    score_b: 0,
    roster: [
      { userId: a, team: 'A' },
      { userId: b, team: 'B' },
    ],
    goals: [{ userId: a, assistUserId: null, minute: 20, ownGoal: false }],
    mvp_user_id: a,
    notes: 'Trận đầu mùa',
    ...extra,
  });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        FcdbbModule,
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    db = module.get(DataSource);
    admin = (
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(201)
    ).body.token;
    a = (
      await request(app.getHttpServer())
        .post('/api/users')
        .set(auth())
        .send({
          username: 'player-a',
          name: 'Nguyễn An',
          password: 'secret123',
        })
        .expect(201)
    ).body.id;
    b = (
      await request(app.getHttpServer())
        .post('/api/users')
        .set(auth())
        .send({
          username: 'player-b',
          name: 'Trần Bình',
          password: 'secret123',
        })
        .expect(201)
    ).body.id;
    member = (
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'player-a', password: 'secret123' })
        .expect(201)
    ).body.token;
    season = (
      await request(app.getHttpServer())
        .post('/api/seasons')
        .set(auth())
        .send({
          name: 'Mùa 2026',
          starts_on: '2026-01-01',
          ends_on: '2026-12-31',
        })
        .expect(201)
    ).body.id;
    match = (
      await request(app.getHttpServer())
        .post('/api/matches')
        .set(auth())
        .send(past)
        .expect(201)
    ).body.id;
  });
  afterAll(async () => {
    await app?.close();
  });

  it('requires authentication for internal data and admin role for writes and audit', async () => {
    await request(app.getHttpServer())
      .get('/api/competition/matches')
      .expect(401);
    await request(app.getHttpServer()).get('/api/users').expect(401);
    await request(app.getHttpServer())
      .post('/api/matches')
      .set(memberAuth())
      .send(past)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/matches/${match}/audit`)
      .set(memberAuth())
      .expect(403);
    await request(app.getHttpServer())
      .put(`/api/users/${b}`)
      .set(memberAuth())
      .send({ name: 'Spoof' })
      .expect(403);
  });
  it('prevents self privilege escalation and validates duplicate accounts and password resets', async () => {
    await request(app.getHttpServer())
      .put(`/api/users/${a}`)
      .set(memberAuth())
      .send({ name: 'Nguyễn An', role: 'admin', password: 'plaintext' })
      .expect(200);
    const user = (
      await request(app.getHttpServer()).get(`/api/users/${a}`).set(auth())
    ).body;
    expect(user.role).toBe('user');
    expect(user.password).toBeUndefined();
    await request(app.getHttpServer())
      .post('/api/users')
      .set(auth())
      .send({ username: 'player-a', name: 'Duplicate', password: 'secret123' })
      .expect(409);
    await request(app.getHttpServer())
      .put(`/api/users/${b}/reset-password`)
      .set(auth())
      .send({ password: 'x' })
      .expect(400);
  });
  it('validates invalid dates, times, GPS and malformed IDs', async () => {
    await request(app.getHttpServer())
      .post('/api/seasons')
      .set(auth())
      .send({ name: 'Bad', starts_on: '2026-99-99', ends_on: '2026-12-31' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/matches')
      .set(auth())
      .send({ ...past, lock_time: past.start_time })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/matches')
      .set(auth())
      .send({ ...past, lat: '' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/attendance/checkin')
      .set(memberAuth())
      .send({ matchId: match, lat: 'NaN', lng: 0 })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/matches/nope/report')
      .set(auth())
      .expect(400);
  });
  it('rejects duplicate rosters, mismatched scores, missing players and foreign-team assists', async () => {
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(report({ score_a: 2 }))
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(
        report({
          roster: [
            { userId: a, team: 'A' },
            { userId: a, team: 'B' },
          ],
        }),
      )
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(
        report({
          goals: [{ userId: a, assistUserId: b, minute: 20, ownGoal: false }],
        }),
      )
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(report({ mvp_user_id: 99999 }))
      .expect(400);
  });
  it('saves completed results atomically with named audit snapshots and no credential exposure', async () => {
    const saved = (
      await request(app.getHttpServer())
        .put(`/api/matches/${match}/report`)
        .set(auth())
        .send(report())
        .expect(200)
    ).body;
    expect(saved.revision).toBe(1);
    expect(saved.roster[0].name).toBe('Nguyễn An');
    const audit = (
      await request(app.getHttpServer())
        .get(`/api/matches/${match}/audit`)
        .set(auth())
    ).body;
    expect(audit[0].actor_name).toBe('Admin FCDBB');
    expect(audit[0].after.score_a).toBe(1);
    expect(JSON.stringify(audit)).not.toContain('password');
  });
  it('calculates standings and player stats, supports filtering and keeps historical names', async () => {
    await request(app.getHttpServer())
      .put(`/api/users/${a}`)
      .set(auth())
      .send({ name: 'Tên mới của An' })
      .expect(200);
    const detail = (
      await request(app.getHttpServer())
        .get(`/api/matches/${match}/report`)
        .set(memberAuth())
    ).body;
    expect(detail.report.roster[0].name).toBe('Nguyễn An');
    const stats = (
      await request(app.getHttpServer())
        .get(`/api/competition/summary?season=${season}`)
        .set(auth())
    ).body;
    expect(stats.completed).toBe(1);
    expect(stats.totalGoals).toBe(1);
    expect(stats.standings[0].points).toBe(3);
    expect(stats.leaderboard[0].goals).toBe(1);
    const list = (
      await request(app.getHttpServer())
        .get(
          `/api/competition/matches?season=${season}&search=Thống&status=completed`,
        )
        .set(auth())
    ).body;
    expect(list.total).toBe(1);
    expect(list.items[0].report.score_a).toBe(1);
  });
  it('requires correction reasons, rejects stale revisions and protects recorded matches from deletion', async () => {
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(report({ revision: 1 }))
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(report({ revision: 0, reason: 'Sửa' }))
      .expect(409);
    await request(app.getHttpServer())
      .delete(`/api/matches/${match}`)
      .set(auth())
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/matches/${match}`)
      .set(auth())
      .send({ title: 'Changed' })
      .expect(400);
  });
  it('counts own goals for the opposing team and updates standings without double counting', async () => {
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(
        report({
          revision: 1,
          reason: 'Bàn phản lưới',
          score_a: 0,
          score_b: 1,
          goals: [{ userId: a, assistUserId: null, minute: 21, ownGoal: true }],
        }),
      )
      .expect(200);
    const stats = (
      await request(app.getHttpServer())
        .get('/api/competition/summary')
        .set(auth())
    ).body;
    expect(stats.completed).toBe(1);
    expect(stats.standings[0].team).toBe('B');
    expect(stats.leaderboard.every((p) => p.goals === 0)).toBe(true);
  });
  it('allows reopening with a reason and excludes drafts and cancelled games from competition', async () => {
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(report({ revision: 2, status: 'draft', reason: 'Cần đối chiếu' }))
      .expect(200);
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/competition/summary')
          .set(auth())
      ).body.completed,
    ).toBe(0);
    await request(app.getHttpServer())
      .put(`/api/matches/${match}/report`)
      .set(auth())
      .send(report({ revision: 3, status: 'cancelled' }))
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/attendance/checkin')
      .set(memberAuth())
      .send({ matchId: match, lat: 10.78, lng: 106.67 })
      .expect(400);
  });
  it('rejects season date changes that exclude already assigned matches', async () => {
    await request(app.getHttpServer())
      .put(`/api/seasons/${season}`)
      .set(auth())
      .send({ starts_on: '2026-02-01' })
      .expect(400);
    const archived = (
      await request(app.getHttpServer())
        .put(`/api/seasons/${season}`)
        .set(auth())
        .send({ archived: true })
        .expect(200)
    ).body;
    expect(archived.archived).toBe(true);
  });
  it('paginates beyond three matches and returns twelve on the legacy home endpoint', async () => {
    for (let i = 0; i < 13; i++)
      await request(app.getHttpServer())
        .post('/api/matches')
        .set(auth())
        .send({ ...past, title: `Buổi đá ${i}` })
        .expect(201);
    const first = (
      await request(app.getHttpServer())
        .get('/api/competition/matches?pageSize=6')
        .set(auth())
    ).body;
    const second = (
      await request(app.getHttpServer())
        .get('/api/competition/matches?pageSize=6&page=2')
        .set(auth())
    ).body;
    expect(first.items).toHaveLength(6);
    expect(first.total).toBe(14);
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(
      (await request(app.getHttpServer()).get('/api/home').set(auth())).body
        .historyMatches,
    ).toHaveLength(12);
  });
  it('defaults the end time and opens check-in 30 minutes before kickoff', async () => {
    const minute = 60_000;
    const now = Date.now();
    const start = now + 31 * minute;
    const http = request(app.getHttpServer());
    const { body: scheduled } = await http
      .post('/api/matches')
      .set(auth())
      .send({
        ...past,
        start_time: new Date(start),
        lock_time: new Date(start + 15 * minute),
        end_time: undefined,
      })
      .expect(201);
    expect(scheduled.end_time).toBe(
      new Date(start + 120 * minute).toISOString(),
    );

    const checkin = () =>
      http
        .post('/api/attendance/checkin')
        .set(memberAuth())
        .send({ matchId: scheduled.id, lat: past.lat, lng: past.lng });
    const { body: rejected } = await checkin().expect(400);
    expect(rejected.message).toContain('Chưa đến giờ điểm danh');

    const rescheduled = now + 29 * minute;
    const { body: updated } = await http
      .put(`/api/matches/${scheduled.id}`)
      .set(auth())
      .send({ start_time: new Date(rescheduled) })
      .expect(200);
    expect(updated.end_time).toBe(
      new Date(rescheduled + 120 * minute).toISOString(),
    );

    const { body: home } = await http
      .get('/api/home')
      .set(memberAuth())
      .expect(200);
    expect(home.activeMatch).toMatchObject({
      id: scheduled.id,
      start_time: new Date(rescheduled).toISOString(),
      checkin_open_time: new Date(rescheduled - 30 * minute).toISOString(),
    });
    const { body: attendance } = await checkin().expect(201);
    expect(attendance).toMatchObject({ status: 'Đúng giờ', delay_seconds: 0 });
  });
  it('uses authenticated identity for check-in, preserves GPS evidence and rejects duplicates', async () => {
    const now = Date.now();
    const active = (
      await request(app.getHttpServer())
        .post('/api/matches')
        .set(auth())
        .send({
          ...past,
          start_time: new Date(now - 1200000),
          lock_time: new Date(now - 60000),
          end_time: new Date(now + 3600000),
        })
        .expect(201)
    ).body;
    await request(app.getHttpServer())
      .post('/api/attendance/checkin')
      .set(memberAuth())
      .send({ userId: b, matchId: active.id, lat: 10.78, lng: 106.67 })
      .expect(201);
    const detail = (
      await request(app.getHttpServer())
        .get(`/api/matches/${active.id}/details`)
        .set(auth())
    ).body;
    expect(detail.attendances[0].user.id).toBe(a);
    expect(detail.attendances[0].delay_seconds).toBeGreaterThan(0);
    expect(detail.attendances[0].user.password).toBeUndefined();
    expect(JSON.stringify(detail)).not.toContain('password');
    await request(app.getHttpServer())
      .post('/api/attendance/checkin')
      .set(memberAuth())
      .send({ matchId: active.id, lat: 10.78, lng: 106.67 })
      .expect(400);
    await request(app.getHttpServer())
      .delete(`/api/users/${a}`)
      .set(auth())
      .expect(400);
    await request(app.getHttpServer())
      .delete(`/api/matches/${active.id}`)
      .set(auth())
      .expect(400);
  });
  it('runs the additive migration over an existing schema without losing records', async () => {
    const legacy = await new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [User, Match, Attendance, Fund, BlogPost],
      synchronize: true,
    }).initialize();
    try {
      const fixture = await legacy
        .getRepository(Match)
        .save(
          legacy
            .getRepository(Match)
            .create({
              ...past,
              start_time: new Date(past.start_time),
              lock_time: new Date(past.lock_time),
              end_time: new Date(past.end_time),
            }),
        );
      const runner = legacy.createQueryRunner();
      await new ClubManagement1794900000000().up(runner);
      await new ClubManagement1794900000000().up(runner);
      expect(await legacy.getRepository(Match).count()).toBe(1);
      expect(
        (await legacy.getRepository(Match).findOneByOrFail({ id: fixture.id }))
          .title,
      ).toBe(past.title);
      expect(await runner.hasTable('seasons')).toBe(true);
      expect(await runner.hasTable('match_reports')).toBe(true);
      expect(await runner.hasTable('match_audit')).toBe(true);
      await runner.release();
    } finally {
      await legacy.destroy();
    }
  });
});
