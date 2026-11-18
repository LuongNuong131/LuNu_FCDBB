import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MatchAudit, MatchReport, Season } from '../football/football.entity';
import type { Actor } from '../football/football.service';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { mkdir, unlink, writeFile } from 'fs/promises';
import {
  User,
  Match,
  Attendance,
  Fund,
  BlogPost,
} from './entities/fcdbb.entity';

@Injectable()
export class FcdbbService implements OnModuleInit {
  private supabase?: SupabaseClient;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Fund) private fundRepo: Repository<Fund>,
    @InjectRepository(BlogPost) private blogRepo: Repository<BlogPost>,
    private jwtService: JwtService,
  ) {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
      );
    }
  }

  async onModuleInit() {
    const admin = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await this.userRepo.save(
        this.userRepo.create({
          username: 'admin',
          password: hashed,
          name: 'Admin FCDBB',
          role: 'admin',
        }),
      );
    }
  }

  private sanitizeUser(user: User | null) {
    if (!user) return user;
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  async login(username: string, pass: string) {
    if (
      typeof username !== 'string' ||
      typeof pass !== 'string' ||
      !username.trim() ||
      !pass
    )
      throw new BadRequestException('Nhập tài khoản và mật khẩu hợp lệ.');
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user || !user.password || !(await bcrypt.compare(pass, user.password)))
      throw new UnauthorizedException('Sai tài khoản/mật khẩu!');
    return {
      token: this.jwtService.sign({
        sub: user.id,
        username: user.username,
        role: user.role,
      }),
      user: this.sanitizeUser(user),
    };
  }

  async createUser(data: Partial<User>) {
    if (
      typeof data.username !== 'string' ||
      typeof data.name !== 'string' ||
      !data.username.trim() ||
      !data.name.trim() ||
      data.username.length > 100 ||
      data.name.length > 150 ||
      typeof data.password !== 'string' ||
      data.password.length < 6
    )
      throw new BadRequestException(
        'Nhập tài khoản, họ tên và mật khẩu ít nhất 6 ký tự.',
      );
    if (await this.userRepo.existsBy({ username: data.username.trim() }))
      throw new ConflictException('Tên tài khoản đã được sử dụng.');
    const homeTeam = this.validateHomeTeam(data.home_team);
    const hashed = await bcrypt.hash(data.password, 10);
    return this.sanitizeUser(
      await this.userRepo.save(
        this.userRepo.create({
          username: data.username.trim(),
          name: data.name.trim(),
          password: hashed,
          role: 'user',
          home_team: homeTeam,
        }),
      ),
    );
  }

  private validateHomeTeam(team: unknown): 'A' | 'B' | null {
    if (team == null || team === '') return null;
    if (team !== 'A' && team !== 'B')
      throw new BadRequestException('Đội cố định chỉ có thể là A hoặc B.');
    return team;
  }

  async setHomeTeam(id: number, team: unknown) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new BadRequestException('Cầu thủ không tồn tại.');
    await this.userRepo.update(id, { home_team: this.validateHomeTeam(team) });
    return this.getProfileById(id);
  }

  async getProfiles() {
    const users = await this.userRepo.find();
    return users.map((user) => this.sanitizeUser(user));
  }

  async getProfileById(id: number) {
    return this.sanitizeUser(await this.userRepo.findOne({ where: { id } }));
  }

  async updateUser(id: number, data: Partial<User>) {
    if (data.height && data.weight) {
      data.height = Math.round(data.height);
      data.weight = Math.round(data.weight);
      data.bmi = parseFloat(
        (data.weight / Math.pow(data.height / 100, 2)).toFixed(2),
      );
    }
    const allowed = [
      'name',
      'nickname',
      'dob',
      'left_foot',
      'right_foot',
      'height',
      'weight',
      'bmi',
      'phone',
      'email',
      'position',
      'role',
    ];
    if (data.role && !['admin', 'user'].includes(data.role))
      throw new BadRequestException('Quyền truy cập không hợp lệ.');
    const update = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowed.includes(key)),
    );
    if (!Object.keys(update).length) return this.getProfileById(id);
    await this.userRepo.update(id, update);
    return this.getProfileById(id);
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new BadRequestException('Thành viên không tồn tại.');
    if (user.username === 'admin')
      throw new BadRequestException('Không thể xóa tài khoản quản trị gốc.');
    if (await this.attendanceRepo.count({ where: { user: { id } } }))
      throw new BadRequestException(
        'Thành viên có dữ liệu điểm danh. Giữ tài khoản để bảo toàn lịch sử.',
      );
    return this.userRepo.delete(id);
  }
  async resetPassword(id: number, newPass: string) {
    if (typeof newPass !== 'string' || newPass.length < 6)
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự.');
    const hashed = await bcrypt.hash(newPass, 10);
    await this.userRepo.update(id, { password: hashed });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Vui lòng nhập đủ mật khẩu.');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'Mật khẩu mới phải khác mật khẩu hiện tại.',
      );
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (
      !user?.password ||
      !(await bcrypt.compare(currentPassword, user.password))
    ) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(id, { password: hashed });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async uploadAvatar(id: number, file: Express.Multer.File) {
    const user = await this.getProfileById(id);
    if (!user) throw new BadRequestException('User not found');
    if (!file) throw new BadRequestException('Vui lòng chọn ảnh đại diện.');

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const dobStr = user.dob ? user.dob.replace(/[-/]/g, '') : 'nodob';
    const filename = `${user.username}_${dobStr}${ext}`;
    const publicUrl = await this.saveImage(file, filename, true);

    user.avatar = `${publicUrl}?t=${Date.now()}`;
    return this.sanitizeUser(await this.userRepo.save(user));
  }

  async getHomeData() {
    const now = new Date();
    const activeMatch = await this.matchRepo
      .createQueryBuilder('m')
      .leftJoin(MatchReport, 'r', 'r.match_id = m.id')
      .where('m.end_time > :now', { now })
      .andWhere('(r.status IS NULL OR r.status = :status)', { status: 'draft' })
      .orderBy('m.start_time', 'ASC')
      .getOne();
    const historyMatches = await this.matchRepo.find({
      where: { end_time: LessThanOrEqual(now) },
      order: { start_time: 'DESC' },
      take: 12,
    });
    return {
      activeMatch: activeMatch
        ? { ...activeMatch, checkin_open_time: this.checkinOpensAt(activeMatch) }
        : null,
      historyMatches,
    };
  }

  async getMatches() {
    return this.matchRepo.find({ order: { start_time: 'DESC' } });
  }

  private parseVietnamDate(value: unknown) {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const raw = String(value);
    const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(raw)
      ? `${raw.length === 16 ? `${raw}:00` : raw}+07:00`
      : raw;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('Thời gian trận đấu không hợp lệ.');
    return date;
  }

  private normalizeMatchTimes(data: Partial<Match>, current?: Match) {
    const normalized = { ...data };
    for (const key of ['start_time', 'lock_time', 'end_time'] as const) {
      if (data[key]) normalized[key] = this.parseVietnamDate(data[key]);
    }
    const start = normalized.start_time
      ? normalized.start_time.getTime()
      : undefined;
    if (start !== undefined && start !== current?.start_time.getTime()) {
      if (normalized.lock_time === undefined)
        normalized.lock_time = new Date(start + 15 * 60_000);
      if (normalized.end_time === undefined)
        normalized.end_time = new Date(start + 120 * 60_000);
    }
    return normalized;
  }

  private validateMatchTimes(data: Partial<Match>) {
    const start = data.start_time ? new Date(data.start_time).getTime() : NaN;
    const lock = data.lock_time ? new Date(data.lock_time).getTime() : NaN;
    const end = data.end_time ? new Date(data.end_time).getTime() : NaN;
    if ([start, lock, end].some(Number.isNaN))
      throw new BadRequestException(
        'Vui lòng kiểm tra các mốc thời gian của trận.',
      );
    if (!(start < lock && lock < end))
      throw new BadRequestException(
        'Mốc tính đi muộn phải nằm giữa giờ bắt đầu và giờ kết thúc trận.',
      );
  }

  private matchFields(data: Partial<Match>) {
    const keys = [
      'title',
      'location_name',
      'lat',
      'lng',
      'map_link',
      'start_time',
      'lock_time',
      'end_time',
    ];
    return Object.fromEntries(
      Object.entries(data).filter(([key]) => keys.includes(key)),
    ) as Partial<Match>;
  }

  private validateMatch(data: Partial<Match>) {
    this.validateMatchTimes(data);
    if (
      typeof data.title !== 'string' ||
      typeof data.location_name !== 'string' ||
      !data.title.trim() ||
      !data.location_name.trim() ||
      data.title.length > 200 ||
      data.location_name.length > 200
    )
      throw new BadRequestException(
        'Nhập tên trận và tên sân (tối đa 200 ký tự).',
      );
    if (
      data.lat === null ||
      data.lng === null ||
      String(data.lat).trim() === '' ||
      String(data.lng).trim() === '' ||
      !Number.isFinite(Number(data.lat)) ||
      Math.abs(Number(data.lat)) > 90 ||
      !Number.isFinite(Number(data.lng)) ||
      Math.abs(Number(data.lng)) > 180
    )
      throw new BadRequestException('Tọa độ sân không hợp lệ.');
    if (data.map_link && !/^https?:\/\//i.test(data.map_link))
      throw new BadRequestException(
        'Link bản đồ phải bắt đầu bằng http:// hoặc https://.',
      );
  }

  async createMatch(data: Partial<Match>, actor: Actor) {
    const normalized = this.normalizeMatchTimes(this.matchFields(data));
    this.validateMatch(normalized);
    return this.matchRepo.manager.transaction(async (manager) => {
      const match = await manager.save(
        Match,
        manager.create(Match, normalized),
      );
      await manager.save(
        MatchAudit,
        manager.create(MatchAudit, {
          match_id: match.id,
          actor_id: actor.id,
          actor_name: actor.name,
          action: 'match.created',
          before: null,
          after: match,
        }),
      );
      return match;
    });
  }

  async updateMatch(id: number, data: Partial<Match>, actor: Actor) {
    return this.matchRepo.manager.transaction(async (manager) => {
      const current = await manager.findOneBy(Match, { id });
      if (!current) throw new BadRequestException('Trận đấu không tồn tại.');
      const normalized = this.normalizeMatchTimes(
        this.matchFields(data),
        current,
      );
      const merged = { ...current, ...normalized };
      this.validateMatch(merged);
      const report = await manager.findOneBy(MatchReport, { match_id: id });
      if (report?.status === 'completed')
        throw new BadRequestException(
          'Mở lại biên bản về bản nháp trước khi sửa lịch trận đã chốt.',
        );
      if (report?.season_id) {
        const season = await manager.findOneByOrFail(Season, {
          id: report.season_id,
        });
        const day = new Date(
          new Date(merged.start_time).getTime() + 7 * 3600000,
        )
          .toISOString()
          .slice(0, 10);
        if (day < season.starts_on || day > season.ends_on)
          throw new BadRequestException(
            'Ngày thi đấu phải nằm trong mùa giải của trận.',
          );
      }
      await manager.update(Match, id, normalized);
      await manager.save(
        MatchAudit,
        manager.create(MatchAudit, {
          match_id: id,
          actor_id: actor.id,
          actor_name: actor.name,
          action: 'match.updated',
          before: current,
          after: merged,
        }),
      );
      return merged;
    });
  }

  async deleteMatch(id: number, actor: Actor) {
    return this.matchRepo.manager.transaction(async (manager) => {
      const current = await manager.findOneBy(Match, { id });
      if (!current) throw new BadRequestException('Trận đấu không tồn tại.');
      const report = await manager.findOneBy(MatchReport, { match_id: id });
      const attendance = await manager.count(Attendance, {
        where: { match: { id } },
      });
      if (report || attendance)
        throw new BadRequestException(
          'Trận đã có biên bản hoặc điểm danh. Chuyển sang trạng thái hủy để giữ lịch sử.',
        );
      await manager.delete(Match, id);
      await manager.save(
        MatchAudit,
        manager.create(MatchAudit, {
          match_id: id,
          actor_id: actor.id,
          actor_name: actor.name,
          action: 'match.deleted',
          before: current,
          after: null,
        }),
      );
      return { message: 'Đã xóa lịch trận chưa có dữ liệu.' };
    });
  }

  private calcDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180,
      p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180,
      dl = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private formatVietnamDateTime(value: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(value);
  }

  private checkinOpensAt(match: Match) {
    return new Date(match.start_time.getTime() - 30 * 60 * 1000);
  }

  async checkin(userId: number, matchId: number, lat: number, lng: number) {
    if (!Number.isInteger(matchId) || matchId < 1)
      throw new BadRequestException('Trận đấu không hợp lệ.');
    if (
      ![lat, lng].every((v) => typeof v === 'number' && Number.isFinite(v)) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      throw new BadRequestException('Vị trí GPS không hợp lệ.');
    const report = await this.matchRepo.manager.findOneBy(MatchReport, {
      match_id: matchId,
    });
    if (report && report.status !== 'draft')
      throw new BadRequestException(
        'Trận đã chốt hoặc hủy, không thể điểm danh.',
      );
    const exist = await this.attendanceRepo.findOne({
      where: { user: { id: userId }, match: { id: matchId } },
    });
    if (exist) throw new BadRequestException('Bạn đã điểm danh rồi!');
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new BadRequestException('Trận đấu không tồn tại!');
    const now = new Date();
    const lockTime = new Date(match.lock_time);
    const endTime = new Date(match.end_time);
    const earliestCheckin = this.checkinOpensAt(match);
    if (now < earliestCheckin) {
      throw new BadRequestException(
        `Chưa đến giờ điểm danh. Bạn có thể điểm danh từ ${this.formatVietnamDateTime(earliestCheckin)}.`,
      );
    }
    if (now > endTime)
      throw new BadRequestException(
        'Trận đấu đã kết thúc, không thể điểm danh.',
      );

    const dist = this.calcDist(lat, lng, match.lat, match.lng);
    if (dist > 50)
      throw new BadRequestException(
        `Bạn cách sân ${Math.round(dist)}m (Yêu cầu <= 50m)!`,
      );

    let status = 'Đúng giờ';
    let delaySeconds = 0;
    if (now > lockTime) {
      status = 'Đi muộn';
      delaySeconds = Math.floor((now.getTime() - lockTime.getTime()) / 1000);
    }
    const record = this.attendanceRepo.create({
      user: { id: userId },
      match: { id: matchId },
      distance: Math.round(dist),
      status,
      delay_seconds: delaySeconds,
    });
    return this.attendanceRepo.save(record);
  }

  async getMatchDetails(matchId: number) {
    const attendances = await this.attendanceRepo.find({
      where: { match: { id: matchId } },
      relations: { user: true },
      order: { created_at: 'ASC' },
    });
    const allUsers = await this.userRepo.find({ where: { role: 'user' } });
    const presentIds = attendances.map((a) => a.user.id);
    const absentUsers = allUsers.filter((u) => !presentIds.includes(u.id));
    return {
      attendances: attendances.map((a) => ({
        ...a,
        user: this.sanitizeUser(a.user),
      })),
      absentUsers: absentUsers.map((u) => this.sanitizeUser(u)),
      absenceNote:
        'Danh sách chưa điểm danh được đối chiếu với thành viên hiện tại; không phải danh sách vắng mặt lịch sử.',
    };
  }

  async getFunds() {
    return this.fundRepo.find({ order: { created_at: 'DESC' } });
  }

  async getBlogPosts() {
    const posts = await this.blogRepo.find({
      order: { created_at: 'DESC', id: 'DESC' },
    });
    const authors = await this.userRepo.find({
      select: { id: true, name: true },
    });
    return posts.map((post) => ({
      ...post,
      images: this.blogImages(post),
      author_name:
        authors.find((u) => u.id === post.author_id)?.name || 'Ban điều hành',
    }));
  }

  private getAdminFromToken(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token)
      throw new ForbiddenException('Bạn cần đăng nhập bằng tài khoản admin.');
    try {
      const payload = this.jwtService.verify(token);
      if (payload?.role !== 'admin')
        throw new ForbiddenException(
          'Chỉ quản trị viên có quyền thực hiện thao tác này.',
        );
      return payload;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('Phiên admin không hợp lệ hoặc đã hết hạn.');
    }
  }

  private blogImages(post: BlogPost): string[] {
    return post.images ?? (post.image_url ? [post.image_url] : []);
  }

  private parseBlogArray(value: unknown, field: string): unknown[] | undefined {
    if (value === undefined) return undefined;
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (!Array.isArray(parsed)) throw new Error();
      return parsed;
    } catch {
      throw new BadRequestException(`Danh sách ${field} không hợp lệ.`);
    }
  }

  private validateBlogImage(file: Express.Multer.File) {
    const b = file.buffer;
    const mime = b?.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
      ? 'image/jpeg'
      : b?.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? 'image/png'
        : ['GIF87a', 'GIF89a'].includes(b?.subarray(0, 6).toString('ascii'))
          ? 'image/gif'
          : b?.subarray(0, 4).toString('ascii') === 'RIFF' &&
              b?.subarray(8, 12).toString('ascii') === 'WEBP'
            ? 'image/webp'
            : null;
    if (!mime || mime !== file.mimetype)
      throw new BadRequestException(
        'Tệp không phải ảnh JPG, PNG, WEBP hoặc GIF hợp lệ.',
      );
    if (file.size > 8 * 1024 * 1024)
      throw new BadRequestException('Mỗi ảnh tối đa 8 MB.');
    const ext = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    }[mime];
    return { ...file, originalname: `photo${ext}` };
  }

  private async saveBlog(
    data: any,
    files: Express.Multer.File[],
    authorization?: string,
    id?: number,
  ) {
    const admin = this.getAdminFromToken(authorization);
    const previous = id ? await this.blogRepo.findOneBy({ id }) : null;
    if (id && !previous)
      throw new BadRequestException('Bài viết không tồn tại.');
    if (
      previous &&
      data.revision !== undefined &&
      Number(data.revision) !== previous.revision
    )
      throw new ConflictException(
        'Bài viết đã thay đổi ở phiên khác. Tải lại trước khi lưu.',
      );
    const title = data.title ?? previous?.title;
    const excerpt = data.excerpt ?? previous?.excerpt ?? '';
    const content = data.content ?? previous?.content ?? '';
    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.length > 200 ||
      typeof excerpt !== 'string' ||
      excerpt.length > 500 ||
      typeof content !== 'string' ||
      content.length > 30000
    )
      throw new BadRequestException(
        'Nhập tiêu đề tối đa 200 ký tự, mô tả 500 ký tự và nội dung 30.000 ký tự.',
      );
    const originalImages = previous ? this.blogImages(previous) : [];
    const retainedInput = this.parseBlogArray(
      data.retained_images,
      'ảnh giữ lại',
    );
    const retained =
      retainedInput ??
      (files.length ? originalImages.slice(1) : originalImages);
    if (
      retained.some(
        (url) =>
          typeof url !== 'string' || !originalImages.includes(url as string),
      ) ||
      new Set(retained).size !== retained.length
    )
      throw new BadRequestException(
        'Chỉ được giữ lại ảnh có trong bài viết này.',
      );
    if (retained.length + files.length > 12)
      throw new BadRequestException('Mỗi bài viết tối đa 12 ảnh.');
    const validated = files.map((file) => this.validateBlogImage(file));
    const order = this.parseBlogArray(data.image_order, 'thứ tự ảnh');
    if (
      order &&
      (order.length !== retained.length + files.length ||
        new Set(order.map((x) => `${typeof x}:${x}`)).size !== order.length ||
        order.some((x) =>
          typeof x === 'number'
            ? !Number.isInteger(x) || x < 0 || x >= files.length
            : typeof x !== 'string' || !retained.includes(x),
        ))
    )
      throw new BadRequestException('Thứ tự ảnh không hợp lệ.');
    const uploaded: string[] = [];
    let saved: BlogPost;
    try {
      for (const file of validated)
        uploaded.push((await this.uploadImageToBucket(file, 'blog'))!);
      const images = order
        ? order.map((x) =>
            typeof x === 'number' ? uploaded[x] : (x as string),
          )
        : retainedInput === undefined && files.length
          ? [...uploaded, ...(retained as string[])]
          : [...(retained as string[]), ...uploaded];
      const changes = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        images,
        image_url: images[0] ?? null,
        revision: (previous?.revision ?? 0) + 1,
      };
      if (previous) {
        const result = await this.blogRepo
          .createQueryBuilder()
          .update(BlogPost)
          .set(changes)
          .where('id = :id AND revision = :revision', {
            id,
            revision: previous.revision,
          })
          .execute();
        if (!result.affected)
          throw new ConflictException(
            'Bài viết vừa được sửa. Tải lại để đối chiếu trước khi lưu.',
          );
        saved = await this.blogRepo.findOneByOrFail({ id: previous.id });
      } else
        saved = await this.blogRepo.save(
          this.blogRepo.create({ ...changes, author_id: Number(admin.sub) }),
        );
    } catch (error) {
      await Promise.all(uploaded.map((url) => this.deleteStoredImage(url)));
      throw error;
    }
    const currentImages = this.blogImages(saved);
    await Promise.all(
      originalImages
        .filter((url) => !currentImages.includes(url))
        .map((url) => this.deleteStoredImage(url)),
    );
    return { ...saved, images: currentImages };
  }

  createBlogPost(
    data: any,
    images: Express.Multer.File[] = [],
    authorization?: string,
  ) {
    return this.saveBlog(data, images, authorization);
  }

  updateBlogPost(
    id: number,
    data: any,
    images: Express.Multer.File[] = [],
    authorization?: string,
  ) {
    return this.saveBlog(data, images, authorization, id);
  }

  async deleteBlogPost(id: number, authorization?: string) {
    this.getAdminFromToken(authorization);
    const post = await this.blogRepo.findOneBy({ id });
    if (!post) throw new BadRequestException('Bài viết không tồn tại.');
    const result = await this.blogRepo.delete({ id, revision: post.revision });
    if (!result.affected)
      throw new ConflictException(
        'Bài viết vừa thay đổi. Tải lại trước khi xóa.',
      );
    await Promise.all(
      this.blogImages(post).map((url) => this.deleteStoredImage(url)),
    );
    return { message: 'Đã xóa bài viết.' };
  }

  async deleteFund(id: number) {
    const fund = await this.fundRepo.findOne({ where: { id } });
    if (!fund) throw new BadRequestException('Giao dịch quỹ không tồn tại.');
    const result = await this.fundRepo.delete(id);
    await this.deleteStoredImage(fund.proof_image);
    return result;
  }

  async updateFund(id: number, data: Partial<Fund>) {
    return this.fundRepo.update(id, data);
  }

  private formatStorageTimestamp(value = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(value)
      .reduce<Record<string, string>>((result, part) => {
        if (part.type !== 'literal') result[part.type] = part.value;
        return result;
      }, {});
    const milliseconds = value.getMilliseconds().toString().padStart(3, '0');
    return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}${parts.second}_${milliseconds}`;
  }

  private async uploadImageToBucket(file: Express.Multer.File, folder: string) {
    if (!file) return undefined;
    const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
    const fileName = `${this.formatStorageTimestamp()}_${randomUUID().slice(0, 8)}${extension}`;
    return this.saveImage(file, `${folder}/${fileName}`);
  }

  private getStoragePath(imageUrl?: string | null) {
    if (!imageUrl) return undefined;
    const cleanUrl = imageUrl.split('?')[0];
    const supabaseMarker = '/storage/v1/object/public/uploads/';
    if (cleanUrl.includes(supabaseMarker)) {
      return decodeURIComponent(cleanUrl.split(supabaseMarker)[1]);
    }
    if (cleanUrl.startsWith('/uploads/')) {
      return decodeURIComponent(cleanUrl.slice('/uploads/'.length));
    }
    return undefined;
  }

  private async deleteStoredImage(imageUrl?: string | null) {
    const storagePath = this.getStoragePath(imageUrl);
    if (!storagePath) return;
    try {
      if (
        this.supabase &&
        imageUrl?.includes('/storage/v1/object/public/uploads/')
      ) {
        const { error } = await this.supabase.storage
          .from('uploads')
          .remove([storagePath]);
        if (error) console.warn(`Không thể xóa ảnh cloud: ${error.message}`);
        return;
      }
      const localPath = path.join(
        process.cwd(),
        'public',
        'uploads',
        storagePath,
      );
      await unlink(localPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    } catch (error) {
      console.warn('Không thể dọn ảnh cũ:', error);
    }
  }

  private async saveImage(
    file: Express.Multer.File,
    relativeName: string,
    overwrite = false,
  ) {
    if (this.supabase) {
      const { error } = await this.supabase.storage
        .from('uploads')
        .upload(relativeName, file.buffer, {
          contentType: file.mimetype,
          upsert: overwrite,
        });
      if (error)
        throw new BadRequestException(`Lỗi upload ảnh: ${error.message}`);
      return this.supabase.storage.from('uploads').getPublicUrl(relativeName)
        .data.publicUrl;
    }

    const safeRelativeName = relativeName
      .split('/')
      .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_'))
      .join('/');
    const localPath = path.join(
      process.cwd(),
      'public',
      'uploads',
      safeRelativeName,
    );
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, file.buffer);
    return `/uploads/${safeRelativeName}`;
  }

  async createFund(data: Partial<Fund>, file?: Express.Multer.File) {
    if (file) {
      const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
      const type = String(data.type || 'proof').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `fund/${this.formatStorageTimestamp()}_${type}${extension}`;

      data.proof_image = await this.saveImage(file, filename);
    }
    return this.fundRepo.save(this.fundRepo.create(data));
  }
}
