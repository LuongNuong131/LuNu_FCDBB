import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../fcdbb/entities/fcdbb.entity';

@Injectable()
export class ClubAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (['login', 'ping'].includes(context.getHandler().name)) return true;
    let user: User | null;
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      const payload = this.jwt.verify(token || '');
      user = await this.users.findOneBy({ id: Number(payload.sub) });
      if (!user) throw new Error('Unknown user');
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      );
    }
    req.actor = { id: user.id, name: user.name, role: user.role };
    const handler = context.getHandler().name;
    if (handler === 'audit' && user.role !== 'admin')
      throw new ForbiddenException('Chỉ quản trị viên được xem nhật ký.');
    if (['GET', 'HEAD'].includes(req.method)) return true;
    if (handler === 'checkin') {
      req.body.userId = user.id;
      return true;
    }
    if (
      ['updateUser', 'changePassword', 'uploadAvatar'].includes(handler) &&
      Number(req.params.id) === user.id
    ) {
      if (handler === 'updateUser') {
        const allowed = [
          'name',
          'nickname',
          'dob',
          'left_foot',
          'right_foot',
          'height',
          'weight',
          'phone',
          'email',
          'position',
        ];
        req.body = Object.fromEntries(
          Object.entries(req.body).filter(([key]) => allowed.includes(key)),
        );
      }
      return true;
    }
    if (user.role !== 'admin')
      throw new ForbiddenException(
        'Chỉ quản trị viên được thực hiện thao tác này.',
      );
    return true;
  }
}
