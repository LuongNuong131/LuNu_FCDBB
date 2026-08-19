import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { FcdbbController } from './fcdbb.controller';
import { FcdbbService } from './fcdbb.service';
import { User, Match, Attendance, Fund } from './entities/fcdbb.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Match, Attendance, Fund]),
    JwtModule.register({
      secret: 'TrungTinhYeuLuNu131',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [FcdbbController],
  providers: [FcdbbService],
})
export class FcdbbModule {}