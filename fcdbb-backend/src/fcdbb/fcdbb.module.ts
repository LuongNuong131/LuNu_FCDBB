import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FcdbbController } from './fcdbb.controller';
import { FcdbbService } from './fcdbb.service';
import { Player, Location, Attendance } from './entities/fcdbb.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Player, Location, Attendance])],
  controllers: [FcdbbController],
  providers: [FcdbbService],
})
export class FcdbbModule {}