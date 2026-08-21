import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { FcdbbController } from './fcdbb.controller';
import { FcdbbService } from './fcdbb.service';
import {
  User,
  Match,
  Attendance,
  Fund,
  BlogPost,
} from './entities/fcdbb.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Match, Attendance, Fund, BlogPost]),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'fcdbb-local-development-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [FcdbbController],
  providers: [FcdbbService],
})
export class FcdbbModule {}
