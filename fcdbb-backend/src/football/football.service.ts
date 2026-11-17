import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Attendance, Match, User } from '../fcdbb/entities/fcdbb.entity';
import {
  GoalEvent,
  MatchAudit,
  MatchReport,
  RosterPlayer,
  Season,
} from './football.entity';

export interface Actor {
  id: number;
  name: string;
  role: string;
}

@Injectable()
export class FootballService {
  constructor(
    private readonly db: DataSource,
    @InjectRepository(Season) private readonly seasons: Repository<Season>,
    @InjectRepository(MatchReport)
    private readonly reports: Repository<MatchReport>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
  ) {}

  getSeasons() {
    return this.seasons.find({ order: { starts_on: 'DESC', id: 'DESC' } });
  }

  async saveSeason(data: any, id?: number) {
    const current = id ? await this.seasons.findOneBy({ id }) : null;
    if (id && !current) throw new NotFoundException('Mùa giải không tồn tại.');
    const value = { ...current, ...data };
    const validDate = (date: unknown) =>
      typeof date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(new Date(date).getTime()) &&
      new Date(date).toISOString().slice(0, 10) === date;
    if (
      typeof value.name !== 'string' ||
      !value.name.trim() ||
      value.name.length > 100 ||
      !validDate(value.starts_on) ||
      !validDate(value.ends_on) ||
      value.starts_on > value.ends_on
    )
      throw new BadRequestException(
        'Nhập tên mùa giải và ngày bắt đầu/kết thúc hợp lệ.',
      );
    if (value.archived !== undefined && typeof value.archived !== 'boolean')
      throw new BadRequestException('Trạng thái mùa giải không hợp lệ.');
    if (id) {
      const records = await this.reports.find({
        where: { season_id: id },
        relations: { match: true },
      });
      if (
        records.some(
          (r) =>
            this.matchDay(r.match) < value.starts_on ||
            this.matchDay(r.match) > value.ends_on,
        )
      )
        throw new BadRequestException(
          'Khoảng ngày mới phải bao gồm các trận đã gắn vào mùa giải.',
        );
    }
    return this.seasons.save(
      this.seasons.create({
        ...(id ? { id } : {}),
        name: value.name.trim(),
        starts_on: value.starts_on,
        ends_on: value.ends_on,
        archived: value.archived ?? false,
      }),
    );
  }

  private matchDay(match: Match) {
    return new Date(new Date(match.start_time).getTime() + 7 * 3600000)
      .toISOString()
      .slice(0, 10);
  }

  private validateSeasonFilter(season?: string) {
    if (
      season &&
      (typeof season !== 'string' ||
        !/^[1-9]\d*$/.test(season) ||
        !Number.isSafeInteger(Number(season)))
    )
      throw new BadRequestException('Bộ lọc mùa giải không hợp lệ.');
  }

  async list(query: any) {
    this.validateSeasonFilter(query.season);
    const page = Math.max(1, Math.min(100000, Number(query.page) || 1)) | 0;
    const pageSize =
      Math.max(1, Math.min(48, Number(query.pageSize) || 12)) | 0;
    const qb = this.matches
      .createQueryBuilder('m')
      .leftJoinAndMapOne('m.report', MatchReport, 'r', 'r.match_id = m.id')
      .leftJoinAndMapOne('m.season', Season, 's', 's.id = r.season_id');
    if (query.season)
      qb.andWhere('r.season_id = :season', { season: Number(query.season) });
    if (typeof query.search === 'string' && query.search.trim())
      qb.andWhere(
        '(LOWER(m.title) LIKE :search OR LOWER(m.location_name) LIKE :search)',
        {
          search: `%${String(query.search).trim().toLowerCase().slice(0, 100)}%`,
        },
      );
    if (query.status === 'completed' || query.status === 'cancelled')
      qb.andWhere('r.status = :status', { status: query.status });
    if (query.status === 'upcoming')
      qb.andWhere(
        'm.end_time > :now AND (r.status IS NULL OR r.status = :draft)',
        { now: new Date(), draft: 'draft' },
      );
    if (query.status === 'history')
      qb.andWhere('(m.end_time <= :now OR r.status IN (:...statuses))', {
        now: new Date(),
        statuses: ['completed', 'cancelled'],
      });
    const [items, total] = await qb
      .orderBy('m.start_time', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { items, total, page, pageSize, pages: Math.ceil(total / pageSize) };
  }

  async getReport(id: number) {
    const match = await this.matches.findOneBy({ id });
    if (!match) throw new NotFoundException('Trận đấu không tồn tại.');
    const report = await this.reports.findOne({
      where: { match_id: id },
      relations: { season: true },
    });
    return {
      match,
      report: report || {
        match_id: id,
        season_id: null,
        status: 'draft',
        score_a: null,
        score_b: null,
        roster: [],
        goals: [],
        mvp_user_id: null,
        notes: '',
        revision: 0,
      },
    };
  }

  async saveReport(id: number, data: any, actor: Actor) {
    return this.db.transaction(async (manager) => {
      const match = await manager.findOneBy(Match, { id });
      if (!match) throw new NotFoundException('Trận đấu không tồn tại.');
      const previous = await manager.findOneBy(MatchReport, { match_id: id });
      if (
        !Number.isInteger(data.revision) ||
        data.revision !== (previous?.revision || 0)
      )
        throw new ConflictException(
          'Trận đấu đã được cập nhật ở phiên khác. Tải lại trước khi lưu.',
        );
      const reason =
        typeof data.reason === 'string'
          ? data.reason.trim().slice(0, 1000)
          : '';
      if (previous?.status === 'completed' && !reason)
        throw new BadRequestException('Ghi lý do khi sửa kết quả đã chốt.');
      if (!['draft', 'completed', 'cancelled'].includes(data.status))
        throw new BadRequestException('Trạng thái trận đấu không hợp lệ.');
      if (
        !Array.isArray(data.roster) ||
        data.roster.length > 100 ||
        !Array.isArray(data.goals) ||
        data.goals.length > 200
      )
        throw new BadRequestException(
          'Đội hình hoặc danh sách bàn thắng không hợp lệ.',
        );
      const users = await manager.find(User);
      const seen = new Set<number>();
      const roster: RosterPlayer[] = data.roster.map((p: any) => {
        if (
          !p ||
          !Number.isInteger(p.userId) ||
          seen.has(p.userId) ||
          !['A', 'B'].includes(p.team)
        )
          throw new BadRequestException(
            'Mỗi cầu thủ chỉ được chọn vào một đội A hoặc B.',
          );
        seen.add(p.userId);
        const snapshot = previous?.roster.find(
          (old) => old.userId === p.userId,
        );
        const user = users.find((u) => u.id === p.userId);
        if (!user && !snapshot)
          throw new BadRequestException('Cầu thủ không tồn tại.');
        return {
          userId: p.userId,
          team: p.team,
          name: snapshot?.name || user!.name,
          homeTeam: snapshot
            ? (snapshot.homeTeam ?? null)
            : (user?.home_team ?? null),
        };
      });
      const goals: GoalEvent[] = data.goals.map((g: any) => {
        if (!g || typeof g !== 'object')
          throw new BadRequestException('Bàn thắng không hợp lệ.');
        const scorer = roster.find((p) => p.userId === g.userId);
        const assist =
          g.assistUserId == null
            ? null
            : roster.find((p) => p.userId === g.assistUserId);
        if (
          !scorer ||
          (g.assistUserId != null &&
            (!assist ||
              assist.team !== scorer.team ||
              assist.userId === scorer.userId)) ||
          (g.minute != null &&
            (!Number.isInteger(g.minute) || g.minute < 0 || g.minute > 180)) ||
          typeof g.ownGoal !== 'boolean' ||
          (g.ownGoal && assist)
        )
          throw new BadRequestException(
            'Kiểm tra người ghi bàn, kiến tạo, phút ghi bàn và bàn phản lưới.',
          );
        return {
          userId: scorer.userId,
          assistUserId: assist?.userId ?? null,
          minute: g.minute ?? null,
          ownGoal: g.ownGoal,
        };
      });
      const score = (v: unknown) =>
        v === null || v === undefined || v === ''
          ? null
          : typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 200
            ? v
            : NaN;
      const score_a = score(data.score_a),
        score_b = score(data.score_b);
      if (Number.isNaN(score_a) || Number.isNaN(score_b))
        throw new BadRequestException('Tỉ số phải là số nguyên từ 0 đến 200.');
      if (data.status === 'completed') {
        if (
          score_a === null ||
          score_b === null ||
          !roster.some((p) => p.team === 'A') ||
          !roster.some((p) => p.team === 'B')
        )
          throw new BadRequestException(
            'Cần tỉ số và ít nhất một cầu thủ mỗi đội để chốt kết quả.',
          );
        if (new Date(match.start_time).getTime() > Date.now())
          throw new BadRequestException(
            'Chưa thể chốt kết quả trận chưa bắt đầu.',
          );
        const counts = { A: 0, B: 0 };
        goals.forEach((g) => {
          const team = roster.find((p) => p.userId === g.userId)!.team;
          counts[g.ownGoal ? (team === 'A' ? 'B' : 'A') : team]++;
        });
        if (counts.A !== score_a || counts.B !== score_b)
          throw new BadRequestException(
            'Số bàn thắng đã ghi phải khớp tỉ số A và B. Thêm đủ người ghi bàn trước khi chốt.',
          );
      }
      let season_id: number | null = null;
      if (data.season_id != null && data.season_id !== '') {
        if (!Number.isInteger(data.season_id))
          throw new BadRequestException('Mùa giải không hợp lệ.');
        const season = await manager.findOneBy(Season, { id: data.season_id });
        if (!season || (season.archived && previous?.season_id !== season.id))
          throw new BadRequestException(
            'Mùa giải không tồn tại hoặc đã lưu trữ.',
          );
        if (
          this.matchDay(match) < season.starts_on ||
          this.matchDay(match) > season.ends_on
        )
          throw new BadRequestException(
            'Ngày thi đấu nằm ngoài mùa giải đã chọn.',
          );
        season_id = season.id;
      }
      const mvp_user_id = data.mvp_user_id ?? null;
      if (mvp_user_id !== null && !roster.some((p) => p.userId === mvp_user_id))
        throw new BadRequestException(
          'Cầu thủ xuất sắc phải có trong đội hình.',
        );
      const next = manager.create(MatchReport, {
        match_id: id,
        season_id,
        status: data.status,
        score_a,
        score_b,
        roster,
        goals,
        mvp_user_id,
        notes: String(data.notes || '').slice(0, 10000),
        revision: (previous?.revision || 0) + 1,
      });
      if (previous) {
        const update = await manager
          .createQueryBuilder()
          .update(MatchReport)
          .set(next)
          .where('match_id = :id AND revision = :revision', {
            id,
            revision: previous.revision,
          })
          .execute();
        if (!update.affected)
          throw new ConflictException(
            'Dữ liệu vừa thay đổi. Tải lại trận đấu.',
          );
      } else {
        // insert rather than upsert so simultaneous first saves cannot overwrite.
        try {
          await manager.insert(MatchReport, next);
        } catch (error) {
          if (
            ['23505', 'SQLITE_CONSTRAINT_PRIMARYKEY'].includes(
              error?.driverError?.code,
            )
          )
            throw new ConflictException(
              'Trận đấu vừa được cập nhật. Tải lại trước khi lưu.',
            );
          throw error;
        }
      }
      const attendance = await manager.find(Attendance, {
        where: { match: { id } },
        relations: { user: true },
      });
      await manager.save(
        MatchAudit,
        manager.create(MatchAudit, {
          match_id: id,
          actor_id: actor.id,
          actor_name: actor.name,
          action: 'report.saved',
          reason,
          before: previous,
          after: {
            ...next,
            attendance: attendance.map((a) => ({
              userId: a.user.id,
              name: a.user.name,
              status: a.status,
              created_at: a.created_at,
              delay_seconds: a.delay_seconds,
              distance: a.distance,
            })),
          },
        }),
      );
      return manager.findOneByOrFail(MatchReport, { match_id: id });
    });
  }

  audit(id: number) {
    return this.db
      .getRepository(MatchAudit)
      .find({ where: { match_id: id }, order: { id: 'DESC' } });
  }

  async summary(season?: string) {
    this.validateSeasonFilter(season);
    const reports = await this.reports.find({
      where: {
        status: 'completed',
        ...(season ? { season_id: Number(season) } : {}),
      },
      relations: { match: true },
      order: { match: { start_time: 'DESC' } },
    });
    const standings = ['A', 'B'].map((team) => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      form: [] as string[],
    }));
    const players = new Map<
      number,
      {
        userId: number;
        name: string;
        appearances: number;
        goals: number;
        assists: number;
        mvps: number;
        wins: number;
      }
    >();
    let totalGoals = 0;
    for (const r of reports) {
      const a = r.score_a!,
        b = r.score_b!;
      totalGoals += a + b;
      for (const t of standings) {
        const gf = t.team === 'A' ? a : b,
          ga = t.team === 'A' ? b : a;
        t.played++;
        t.goalsFor += gf;
        t.goalsAgainst += ga;
        if (gf > ga) {
          t.won++;
          t.points += 3;
        } else if (gf === ga) {
          t.drawn++;
          t.points++;
        } else t.lost++;
        if (t.form.length < 5)
          t.form.push(gf > ga ? 'W' : gf === ga ? 'D' : 'L');
      }
      for (const p of r.roster) {
        const stat = players.get(p.userId) || {
          userId: p.userId,
          name: p.name,
          appearances: 0,
          goals: 0,
          assists: 0,
          mvps: 0,
          wins: 0,
        };
        stat.appearances++;
        stat.goals += r.goals.filter(
          (g) => g.userId === p.userId && !g.ownGoal,
        ).length;
        stat.assists += r.goals.filter(
          (g) => g.assistUserId === p.userId,
        ).length;
        stat.mvps += Number(r.mvp_user_id === p.userId);
        stat.wins += Number(p.team === 'A' ? a > b : b > a);
        players.set(p.userId, stat);
      }
    }
    standings.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor,
    );
    return {
      completed: reports.length,
      totalGoals,
      players: players.size,
      standings,
      leaderboard: [...players.values()].sort(
        (a, b) =>
          b.goals - a.goals ||
          b.assists - a.assists ||
          b.mvps - a.mvps ||
          a.userId - b.userId,
      ),
    };
  }
}
