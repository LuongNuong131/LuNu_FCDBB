import { Injectable, OnModuleInit, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { User, Match, Attendance, Fund, BlogPost } from './entities/fcdbb.entity';

@Injectable()
export class FcdbbService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Fund) private fundRepo: Repository<Fund>,
    @InjectRepository(BlogPost) private blogRepo: Repository<BlogPost>,
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
    const endTimestamp = new Date(normalized.end_time as Date).getTime();
    if (endTimestamp <= Date.now()) {
      const received = this.formatVietnamDateTime(new Date(endTimestamp));
      const serverNow = this.formatVietnamDateTime(new Date());
      throw new BadRequestException(`Chốt sổ đang được nhận là ${received}, trong khi giờ hệ thống là ${serverNow}. Hãy chọn lại ngày/giờ chốt sổ sau hiện tại.`);
    }
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

  private formatVietnamDateTime(value: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(value);
  }

  async checkin(userId: number, matchId: number, lat: number, lng: number) {
    const exist = await this.attendanceRepo.findOne({ where: { user: { id: userId }, match: { id: matchId } } });
    if (exist) throw new BadRequestException('Bạn đã điểm danh rồi!');
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new BadRequestException('Trận đấu không tồn tại!');
    const now = new Date();
    const lockTime = new Date(match.lock_time);
    const endTime = new Date(match.end_time);
    const earliestCheckin = new Date(lockTime.getTime() - 15 * 60 * 1000);
    if (now < earliestCheckin) {
      throw new BadRequestException(`Chưa đến giờ điểm danh. Bạn có thể điểm danh từ ${this.formatVietnamDateTime(earliestCheckin)}.`);
    }
    if (now > endTime) throw new BadRequestException('Trận đấu đã kết thúc, không thể điểm danh.');

    const dist = this.calcDist(lat, lng, match.lat, match.lng);
    if (dist > 50) throw new BadRequestException(`Bạn cách sân ${Math.round(dist)}m (Yêu cầu <= 50m)!`);

    let status = 'Đúng giờ'; let delaySeconds = 0;
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

  async getBlogPosts() {
    return this.blogRepo.find({ order: { created_at: 'DESC' } });
  }

  private getAdminFromToken(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new ForbiddenException('Bạn cần đăng nhập bằng tài khoản admin.');
    try {
      const payload = this.jwtService.verify(token);
      if (payload?.role !== 'admin') throw new ForbiddenException('Chỉ admin mới có quyền quản lý blog.');
      return payload;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('Phiên admin không hợp lệ hoặc đã hết hạn.');
    }
  }

  async createBlogPost(data: Partial<BlogPost>, image?: Express.Multer.File, authorization?: string) {
    const admin = this.getAdminFromToken(authorization);
    const imageUrl = image ? await this.uploadImageToBucket(image, 'blog') : data.image_url;
    if (!data.title?.trim()) throw new BadRequestException('Tiêu đề bài viết không được để trống.');
    return this.blogRepo.save(this.blogRepo.create({
      title: data.title.trim(),
      excerpt: data.excerpt?.trim() || undefined,
      content: data.content?.trim() || undefined,
      image_url: imageUrl || undefined,
      author_id: Number(admin.sub),
    }));
  }

  async updateBlogPost(id: number, data: Partial<BlogPost>, image?: Express.Multer.File, authorization?: string) {
    this.getAdminFromToken(authorization);
    const post = await this.blogRepo.findOne({ where: { id } });
    if (!post) throw new BadRequestException('Bài viết không tồn tại.');
    const imageUrl = image ? await this.uploadImageToBucket(image, 'blog') : data.image_url;
    await this.blogRepo.update(id, {
      title: data.title?.trim() || post.title,
      excerpt: data.excerpt?.trim() ?? post.excerpt,
      content: data.content?.trim() ?? post.content,
      image_url: imageUrl || post.image_url,
    });
    return this.blogRepo.findOne({ where: { id } });
  }

  async deleteBlogPost(id: number, authorization?: string) {
    this.getAdminFromToken(authorization);
    const result = await this.blogRepo.delete(id);
    if (!result.affected) throw new BadRequestException('Bài viết không tồn tại.');
    return { message: 'Đã xóa bài viết.' };
  }
  
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

  private async uploadImageToBucket(file: Express.Multer.File, folder: string) {
    if (!file) return undefined;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${folder}/${Date.now()}_${safeName}`;
    const { error } = await this.supabase.storage.from('uploads').upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) throw new BadRequestException(`Lỗi upload ảnh: ${error.message}`);
    return this.supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl;
  }

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
