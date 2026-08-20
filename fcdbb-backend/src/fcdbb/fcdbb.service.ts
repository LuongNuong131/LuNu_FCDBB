import { Injectable, OnModuleInit, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { User, Match, Attendance, Fund } from './entities/fcdbb.entity';

@Injectable()
export class FcdbbService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Fund) private fundRepo: Repository<Fund>,
    private jwtService: JwtService,
  ) {
    // Thêm dấu ! để báo cho TypeScript biết chắc chắn biến này tồn tại
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  }

  async onModuleInit() {
    const admin = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await this.userRepo.save(this.userRepo.create({ username: 'admin', password: hashed, name: 'Admin FCDBB', role: 'admin' }));
    }
  }

  async login(username: string, pass: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user || !user.password || !(await bcrypt.compare(pass, user.password))) throw new UnauthorizedException('Sai tài khoản/mật khẩu!');
    return { token: this.jwtService.sign({ sub: user.id, username: user.username, role: user.role }), user };
  }

  async createUser(data: Partial<User>) {
    const hashed = await bcrypt.hash(data.password || '', 10);
    return this.userRepo.save(this.userRepo.create({ ...data, password: hashed }));
  }

  async getProfiles() { return this.userRepo.find(); }
  async getProfileById(id: number) { return this.userRepo.findOne({ where: { id }}); }

  async updateUser(id: number, data: Partial<User>) {
    if (data.height && data.weight) {
      data.height = Math.round(data.height);
      data.weight = Math.round(data.weight);
      data.bmi = parseFloat((data.weight / Math.pow(data.height / 100, 2)).toFixed(2));
    }
    await this.userRepo.update(id, data);
    return this.getProfileById(id);
  }

  async deleteUser(id: number) { return this.userRepo.delete(id); }
  async resetPassword(id: number, newPass: string) {
    const hashed = await bcrypt.hash(newPass, 10);
    await this.userRepo.update(id, { password: hashed });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Vui lòng nhập đủ mật khẩu.');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại.');
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user?.password || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(id, { password: hashed });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async uploadAvatar(id: number, file: Express.Multer.File) {
    const user = await this.getProfileById(id);
    if (!user) throw new BadRequestException('User not found');

    const ext = path.extname(file.originalname);
    const dobStr = user.dob ? user.dob.replace(/[-/]/g, '') : 'nodob';
    const filename = `${user.username}_${dobStr}${ext}`;

    const { data, error } = await this.supabase.storage.from('uploads').upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

    if (error) throw new BadRequestException('Lỗi tải ảnh lên đám mây!');
    const publicUrl = this.supabase.storage.from('uploads').getPublicUrl(filename).data.publicUrl;
    
    user.avatar = `${publicUrl}?t=${Date.now()}`;
    return this.userRepo.save(user);
  }

  async getHomeData() {
    const now = new Date();
    const activeMatch = await this.matchRepo.findOne({ where: { end_time: MoreThan(now) }, order: { start_time: 'ASC' } });
    const historyMatches = await this.matchRepo.find({ where: { end_time: LessThanOrEqual(now) }, order: { start_time: 'DESC' }, take: 3 });
    return { activeMatch, historyMatches };
  }

  async getMatches() { return this.matchRepo.find({ order: { start_time: 'DESC' } }); }

  private parseVietnamDate(value: unknown) {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const raw = String(value);
    const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(raw)
      ? `${raw.length === 16 ? `${raw}:00` : raw}+07:00`
      : raw;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Thời gian trận đấu không hợp lệ.');
    return date;
  }

  private normalizeMatchTimes(data: Partial<Match>) {
    const normalized = { ...data };
    for (const key of ['start_time', 'lock_time', 'end_time'] as const) {
      if (data[key]) normalized[key] = this.parseVietnamDate(data[key]) as never;
    }
    return normalized;
  }

  private validateMatchTimes(data: Partial<Match>) {
    const start = data.start_time ? new Date(data.start_time).getTime() : NaN;
    const lock = data.lock_time ? new Date(data.lock_time).getTime() : NaN;
    const end = data.end_time ? new Date(data.end_time).getTime() : NaN;
    if ([start, lock, end].some(Number.isNaN)) throw new BadRequestException('Vui lòng nhập đủ và đúng ba mốc thời gian.');
    if (!(start < lock && lock < end)) throw new BadRequestException('Thời gian phải theo thứ tự: Bắt đầu < Khóa điểm danh < Chốt sổ.');
  }

  async createMatch(data: Partial<Match>) {
    const normalized = this.normalizeMatchTimes(data);
    this.validateMatchTimes(normalized);
    return this.matchRepo.save(this.matchRepo.create(normalized));
  }

  async updateMatch(id: number, data: Partial<Match>) {
    const current = await this.matchRepo.findOne({ where: { id } });
    if (!current) throw new BadRequestException('Trận đấu không tồn tại.');
    const normalized = this.normalizeMatchTimes(data);
    const merged = { ...current, ...normalized };
    this.validateMatchTimes(merged);
    await this.matchRepo.update(id, normalized);
    return this.matchRepo.findOne({ where: { id } });
  }

  async deleteMatch(id: number) { return this.matchRepo.delete(id); }

  private calcDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  async checkin(userId: number, matchId: number, lat: number, lng: number) {
    const exist = await this.attendanceRepo.findOne({ where: { user: { id: userId }, match: { id: matchId } } });
    if (exist) throw new BadRequestException('Bạn đã điểm danh rồi!');
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new BadRequestException('Trận đấu không tồn tại!');
    const now = new Date();
    if (now > new Date(match.end_time)) throw new BadRequestException('Trận đấu đã kết thúc!');

    const dist = this.calcDist(lat, lng, match.lat, match.lng);
    if (dist > 50) throw new BadRequestException(`Bạn cách sân ${Math.round(dist)}m (Yêu cầu <= 50m)!`);

    let status = 'Đúng giờ'; let delaySeconds = 0;
    const lockTime = new Date(match.lock_time);
    if (now > lockTime) {
      status = 'Đi muộn';
      delaySeconds = Math.floor((now.getTime() - lockTime.getTime()) / 1000);
    }
    const record = this.attendanceRepo.create({ user: { id: userId }, match: { id: matchId }, distance: Math.round(dist), status, delay_seconds: delaySeconds });
    return this.attendanceRepo.save(record);
  }

  async getMatchDetails(matchId: number) {
    const attendances = await this.attendanceRepo.find({ where: { match: { id: matchId } }, relations: { user: true }, order: { created_at: 'ASC' } });
    const allUsers = await this.userRepo.find({ where: { role: 'user' } });
    const presentIds = attendances.map(a => a.user.id);
    const absentUsers = allUsers.filter(u => !presentIds.includes(u.id));
    return { attendances, absentUsers };
  }

  async getFunds() { return this.fundRepo.find({ order: { created_at: 'DESC' } }); }
  
  async deleteFund(id: number) { 
    const fund = await this.fundRepo.findOne({ where: { id } });
    if (fund && fund.proof_image && fund.proof_image.includes('supabase.co')) {
      const fileName = fund.proof_image.split('/').pop();
      // Bọc thêm if(fileName) để chiều lòng TypeScript
      if (fileName) {
        await this.supabase.storage.from('uploads').remove([fileName.split('?')[0]]);
      }
    }
    return this.fundRepo.delete(id); 
  }
  
  async updateFund(id: number, data: Partial<Fund>) { return this.fundRepo.update(id, data); }

  async createFund(data: Partial<Fund>, file?: Express.Multer.File) {
    if (file) {
      const d = new Date(); const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
      const filename = `${dateStr}_${data.type}${path.extname(file.originalname)}`;
      
      const { data: uploadData, error } = await this.supabase.storage.from('uploads').upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });
      if (error) throw new BadRequestException('Lỗi tải minh chứng lên đám mây!');
      const publicUrl = this.supabase.storage.from('uploads').getPublicUrl(filename).data.publicUrl;
      data.proof_image = publicUrl;
    }
    return this.fundRepo.save(this.fundRepo.create(data));
  }
}
