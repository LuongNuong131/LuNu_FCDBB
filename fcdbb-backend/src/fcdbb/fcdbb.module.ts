import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { FcdbbController } from './fcdbb.controller';
import { FcdbbService } from './fcdbb.service';
import { Season, MatchReport, MatchAudit } from '../football/football.entity';
import { FootballService } from '../football/football.service';
import { FootballController } from '../football/football.controller';
import { ClubAuthGuard } from '../football/auth.guard';
import {
  User,
  Match,
  Attendance,
  Fund,
  BlogPost,
} from './entities/fcdbb.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Match,
      Attendance,
      Fund,
      BlogPost,
      Season,
      MatchReport,
      MatchAudit,
    ]),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'fcdbb-local-development-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [FcdbbController, FootballController],
  providers: [FcdbbService, FootballService, ClubAuthGuard],
})
export class FcdbbModule {}
