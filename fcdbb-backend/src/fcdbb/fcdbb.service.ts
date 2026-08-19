import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, Location, Attendance } from './entities/fcdbb.entity';
import * as xlsx from 'xlsx';

@Injectable()
export class FcdbbService {
  constructor(
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    @InjectRepository(Location) private locationRepo: Repository<Location>,
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
  ) {}

  async getPlayers() {
    return this.playerRepo.find({ order: { name: 'ASC' } });
  }

  async importPlayers(buffer: Buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    await this.playerRepo.clear();
    
    const players = data.map((row: any) => ({
      name: row['Tên Cầu Thủ'] || row['Name'] || row['Tên'] || Object.values(row)[0]
    }));
    
    return this.playerRepo.save(players);
  }

  async getLocations() {
    return this.locationRepo.find();
  }

  async addLocation(data: Partial<Location>) {
    const newLoc = this.locationRepo.create(data);
    return this.locationRepo.save(newLoc);
  }

  async deleteLocation(id: number) {
    return this.locationRepo.delete(id);
  }

  async getHistory() {
    return this.attendanceRepo.find({
      relations: ['player', 'location'],
      order: { created_at: 'DESC' },
    });
  }

  async checkin(playerId: number, locationId: number, distance: number) {
    const location = await this.locationRepo.findOne({ where: { id: locationId } });
    const status = distance <= location.radius ? 'Hợp lệ' : 'Ngoài phạm vi';

    const record = this.attendanceRepo.create({
      player: { id: playerId },
      location: { id: locationId },
      distance,
      status,
    });
    return this.attendanceRepo.save(record);
  }
}