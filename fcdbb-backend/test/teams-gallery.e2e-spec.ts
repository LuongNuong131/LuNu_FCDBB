import { Test } from '@nestjs/testing';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { access, readdir } from 'fs/promises';
import { join } from 'path';
import { FcdbbModule } from '../src/fcdbb/fcdbb.module';
import { FcdbbService } from '../src/fcdbb/fcdbb.service';
import {
  Attendance,
  BlogPost,
  Fund,
  Match,
  User,
} from '../src/fcdbb/entities/fcdbb.entity';
import { TeamAndGallery1794901000000 } from '../src/migrations/1794901000000-TeamAndGallery';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=',
  'base64',
);
const past = {
  title: 'Trận kiểm thử đội cố định',
  location_name: 'Sân nội bộ',
  lat: 10.78,
  lng: 106.67,
  start_time: '2026-01-10T18:00:00+07:00',
  lock_time: '2026-01-10T18:15:00+07:00',
  end_time: '2026-01-10T20:00:00+07:00',
};
const localFile = (url: string) => join(process.cwd(), 'public', url);

describe('Fixed teams, per-match loans and multi-photo blog', () => {
  let app: INestApplication,
    db: DataSource,
    srv: FcdbbService,
    admin: string,
    member: string,
    a: number,
    b: number,
    match: number,
    post: any;
  const auth = () => ({ Authorization: `Bearer ${admin}` }),
    memberAuth = () => ({ Authorization: `Bearer ${member}` });
  const report = (extra: any = {}) => ({
    revision: 0,
    status: 'draft',
    season_id: null,
    score_a: null,
    score_b: null,
    roster: [
      { userId: a, team: 'B', homeTeam: 'B' },
      { userId: b, team: 'A' },
    ],
    goals: [],
    mvp_user_id: null,
    notes: 'Cân bằng quân số',
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
    srv = module.get(FcdbbService);
    admin = (
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' })
    ).body.token;
    a = (
      await request(app.getHttpServer())
        .post('/api/users')
        .set(auth())
        .send({
          username: 'fixed-a',
          name: 'Nguyễn An',
          password: 'secret123',
          home_team: 'A',
        })
        .expect(201)
    ).body.id;
    b = (
      await request(app.getHttpServer())
        .post('/api/users')
        .set(auth())
        .send({
          username: 'fixed-b',
          name: 'Trần Bình',
          password: 'secret123',
          home_team: 'B',
        })
        .expect(201)
    ).body.id;
    member = (
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'fixed-a', password: 'secret123' })
    ).body.token;
    match = (
      await request(app.getHttpServer())
        .post('/api/matches')
        .set(auth())
        .send(past)
    ).body.id;
  });
  afterAll(async () => {
    await app?.close();
  });
  it('only admins can set fixed teams, including their own; normal profile edits cannot change teams', async () => {
    await request(app.getHttpServer())
      .put(`/api/users/${a}/team`)
      .set(memberAuth())
      .send({ home_team: 'B' })
      .expect(403);
    await request(app.getHttpServer())
      .put(`/api/users/${a}`)
      .set(memberAuth())
      .send({ home_team: 'B', name: 'Nguyễn An' })
      .expect(200);
    expect(
      (await request(app.getHttpServer()).get(`/api/users/${a}`).set(auth()))
        .body.home_team,
    ).toBe('A');
    await request(app.getHttpServer())
      .put('/api/users/1/team')
      .set(auth())
      .send({ home_team: 'A' })
      .expect(200);
    await request(app.getHttpServer())
      .put(`/api/users/${a}/team`)
      .set(auth())
      .send({ home_team: 'C' })
      .expect(400);
  });
  it('saves a temporary A-to-B loan, snapshots the actual fixed team, and keeps the player profile unchanged', async () => {
    const saved = (
      await request(app.getHttpServer())
        .put(`/api/matches/${match}/report`)
        .set(auth())
        .send(report())
        .expect(200)
    ).body;
    expect(saved.roster.find((p) => p.userId === a)).toMatchObject({
      team: 'B',
      homeTeam: 'A',
    });
    expect(
      (await request(app.getHttpServer()).get(`/api/users/${a}`).set(auth()))
        .body.home_team,
    ).toBe('A');
    const next = (
      await request(app.getHttpServer())
        .post('/api/matches')
        .set(auth())
        .send(past)
    ).body.id;
    const nextSaved = (
      await request(app.getHttpServer())
        .put(`/api/matches/${next}/report`)
        .set(auth())
        .send(
          report({
            roster: [
              { userId: a, team: 'A' },
              { userId: b, team: 'B' },
            ],
          }),
        )
        .expect(200)
    ).body;
    expect(nextSaved.roster.find((p) => p.userId === a)).toMatchObject({
      team: 'A',
      homeTeam: 'A',
    });
  });
  it('changing permanent teams does not rewrite earlier lineups or their original-team snapshot', async () => {
    await request(app.getHttpServer())
      .put(`/api/users/${a}/team`)
      .set(auth())
      .send({ home_team: 'B' })
      .expect(200);
    const saved = (
      await request(app.getHttpServer())
        .put(`/api/matches/${match}/report`)
        .set(auth())
        .send(report({ revision: 1 }))
        .expect(200)
    ).body;
    expect(saved.roster.find((p) => p.userId === a)).toMatchObject({
      team: 'B',
      homeTeam: 'A',
    });
    await request(app.getHttpServer())
      .put(`/api/users/${a}/team`)
      .set(auth())
      .send({ home_team: 'A' })
      .expect(200);
  });
  it('attendance exposes each fixed team so admin imports use that team rather than alternating players', async () => {
    const now = Date.now();
    const active = (
      await request(app.getHttpServer())
        .post('/api/matches')
        .set(auth())
        .send({
          ...past,
          start_time: new Date(now - 600000),
          lock_time: new Date(now + 60000),
          end_time: new Date(now + 3600000),
        })
    ).body;
    await request(app.getHttpServer())
      .post('/api/attendance/checkin')
      .set(memberAuth())
      .send({ matchId: active.id, lat: 10.78, lng: 106.67 })
      .expect(201);
    const details = (
      await request(app.getHttpServer())
        .get(`/api/matches/${active.id}/details`)
        .set(auth())
    ).body;
    expect(details.attendances[0].user.home_team).toBe('A');
  });
  it('uploads multiple images with unique names and honors the chosen cover order', async () => {
    post = (
      await request(app.getHttpServer())
        .post('/api/blog')
        .set(auth())
        .field('title', 'Album đầu tiên')
        .field('content', 'Kỷ niệm của đội')
        .field('image_order', '[1,0]')
        .attach('images', png, {
          filename: 'same.png',
          contentType: 'image/png',
        })
        .attach('images', png, {
          filename: 'same.png',
          contentType: 'image/png',
        })
        .expect(201)
    ).body;
    expect(post.images).toHaveLength(2);
    expect(new Set(post.images).size).toBe(2);
    expect(post.image_url).toBe(post.images[0]);
    expect(post.revision).toBe(1);
    for (const url of post.images)
      await expect(access(localFile(url))).resolves.toBeUndefined();
    expect(
      (await request(app.getHttpServer()).get('/api/blog').set(auth())).body[0]
        .images,
    ).toEqual(post.images);
  });
  it('retains selected old images, inserts new photos in order, and removes discarded files after saving', async () => {
    const removed = post.images[0],
      kept = post.images[1];
    post = (
      await request(app.getHttpServer())
        .put(`/api/blog/${post.id}`)
        .set(auth())
        .field('revision', '1')
        .field('retained_images', JSON.stringify([kept]))
        .field('image_order', JSON.stringify([0, kept]))
        .attach('images', png, {
          filename: 'new.png',
          contentType: 'image/png',
        })
        .expect(200)
    ).body;
    expect(post.images).toHaveLength(2);
    expect(post.images[1]).toBe(kept);
    expect(post.revision).toBe(2);
    expect(post.image_url).toBe(post.images[0]);
    await expect(access(localFile(removed))).rejects.toThrow();
    await expect(access(localFile(kept))).resolves.toBeUndefined();
  });
  it('rejects stale revisions, foreign retained URLs, duplicate order references and malformed manifests', async () => {
    await request(app.getHttpServer())
      .put(`/api/blog/${post.id}`)
      .set(auth())
      .field('revision', '1')
      .field('title', 'Stale')
      .expect(409);
    await request(app.getHttpServer())
      .put(`/api/blog/${post.id}`)
      .set(auth())
      .field('retained_images', '["/uploads/blog/another-post.png"]')
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/blog/${post.id}`)
      .set(auth())
      .field('retained_images', JSON.stringify(post.images))
      .field('image_order', JSON.stringify([post.images[0], post.images[0]]))
      .expect(400);
    await request(app.getHttpServer())
      .put(`/api/blog/${post.id}`)
      .set(auth())
      .field('retained_images', 'not json')
      .expect(400);
  });
  it('rejects non-admin uploads, fake image contents, SVG and albums over twelve files', async () => {
    await request(app.getHttpServer())
      .post('/api/blog')
      .set(memberAuth())
      .field('title', 'No access')
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/blog')
      .set(auth())
      .field('title', 'Fake')
      .attach('images', Buffer.from('not an image'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/blog')
      .set(auth())
      .field('title', 'SVG')
      .attach('images', Buffer.from('<svg/>'), {
        filename: 'x.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
    let req = request(app.getHttpServer())
      .post('/api/blog')
      .set(auth())
      .field('title', 'Too many');
    for (let i = 0; i < 13; i++)
      req = req.attach('images', png, {
        filename: `x${i}.png`,
        contentType: 'image/png',
      });
    await req.expect(400);
  });
  it('cleans partial uploads if storage fails and leaves the existing post intact', async () => {
    const folder = join(process.cwd(), 'public', 'uploads', 'blog'),
      before = (await readdir(folder)).sort(),
      original = (srv as any).uploadImageToBucket.bind(srv);
    let count = 0;
    const spy = jest
      .spyOn(srv as any, 'uploadImageToBucket')
      .mockImplementation(async (...args: any[]) => {
        if (++count === 2) throw new BadRequestException('Storage failed');
        return original(...args);
      });
    try {
      await request(app.getHttpServer())
        .put(`/api/blog/${post.id}`)
        .set(auth())
        .field('retained_images', JSON.stringify(post.images))
        .attach('images', png, {
          filename: 'one.png',
          contentType: 'image/png',
        })
        .attach('images', png, {
          filename: 'two.png',
          contentType: 'image/png',
        })
        .expect(400);
    } finally {
      spy.mockRestore();
    }
    expect((await readdir(folder)).sort()).toEqual(before);
    expect(
      (await db.getRepository(BlogPost).findOneByOrFail({ id: post.id }))
        .revision,
    ).toBe(2);
  });
  it('keeps legacy single-photo articles readable and allows explicit removal of every photo', async () => {
    const legacy = await db
      .getRepository(BlogPost)
      .save(
        db
          .getRepository(BlogPost)
          .create({ title: 'Bài cũ', image_url: '/uploads/blog/legacy.png' }),
      );
    expect(
      (
        await request(app.getHttpServer()).get('/api/blog').set(auth())
      ).body.find((p) => p.id === legacy.id).images,
    ).toEqual(['/uploads/blog/legacy.png']);
    const empty = (
      await request(app.getHttpServer())
        .put(`/api/blog/${legacy.id}`)
        .set(auth())
        .field('retained_images', '[]')
        .field('image_order', '[]')
        .expect(200)
    ).body;
    expect(empty.images).toEqual([]);
    expect(empty.image_url).toBeNull();
  });
  it('deletes every stored photo when the album post is deleted', async () => {
    const urls = [...post.images];
    await request(app.getHttpServer())
      .delete(`/api/blog/${post.id}`)
      .set(auth())
      .expect(200);
    for (const url of urls)
      await expect(access(localFile(url))).rejects.toThrow();
  });
  it('legacy single-cover updates preserve other images in an existing album', async () => {
    const created = (
      await request(app.getHttpServer())
        .post('/api/blog')
        .set(auth())
        .field('title', 'Legacy cover editor')
        .attach('images', png, {
          filename: 'one.png',
          contentType: 'image/png',
        })
        .attach('images', png, {
          filename: 'two.png',
          contentType: 'image/png',
        })
        .expect(201)
    ).body;
    const updated = (
      await request(app.getHttpServer())
        .put(`/api/blog/${created.id}`)
        .set(auth())
        .attach('image', png, {
          filename: 'cover.png',
          contentType: 'image/png',
        })
        .expect(200)
    ).body;
    expect(updated.images).toHaveLength(2);
    expect(updated.images[0]).not.toBe(created.images[0]);
    expect(updated.images[1]).toBe(created.images[1]);
    await expect(access(localFile(created.images[0]))).rejects.toThrow();
    await request(app.getHttpServer())
      .delete(`/api/blog/${created.id}`)
      .set(auth())
      .expect(200);
  });
  it('migrates existing users and articles without inventing teams or losing their old image', async () => {
    const legacy = await new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [User, Match, Attendance, Fund, BlogPost],
      synchronize: true,
    }).initialize();
    try {
      const user = await legacy
        .getRepository(User)
        .save(
          legacy
            .getRepository(User)
            .create({ username: 'legacy', password: 'hash', name: 'Tên cũ' }),
        );
      const article = await legacy
        .getRepository(BlogPost)
        .save(
          legacy
            .getRepository(BlogPost)
            .create({ title: 'Ảnh cũ', image_url: '/uploads/blog/old.png' }),
        );
      const q = legacy.createQueryRunner();
      await q.dropColumn('users', 'home_team');
      await q.dropColumn('blog_posts', 'images');
      await q.dropColumn('blog_posts', 'revision');
      await new TeamAndGallery1794901000000().up(q);
      await new TeamAndGallery1794901000000().up(q);
      expect(
        (await legacy.getRepository(User).findOneByOrFail({ id: user.id }))
          .home_team,
      ).toBeNull();
      expect(
        await legacy
          .getRepository(BlogPost)
          .findOneByOrFail({ id: article.id }),
      ).toMatchObject({
        image_url: '/uploads/blog/old.png',
        images: null,
        revision: 1,
      });
      await q.release();
    } finally {
      await legacy.destroy();
    }
  });
});
