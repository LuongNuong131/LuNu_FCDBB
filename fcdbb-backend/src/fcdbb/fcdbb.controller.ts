import { Controller, Get, Post, Delete, Param, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FcdbbService } from './fcdbb.service';

@Controller('api')
export class FcdbbController {
  constructor(private readonly fcdbbService: FcdbbService) {}

  @Get('players')
  getPlayers() { return this.fcdbbService.getPlayers(); }

  @Post('players/import')
  @UseInterceptors(FileInterceptor('file'))
  importPlayers(@UploadedFile() file: Express.Multer.File) {
    return this.fcdbbService.importPlayers(file.buffer);
  }

  @Get('locations')
  getLocations() { return this.fcdbbService.getLocations(); }

  @Post('locations')
  addLocation(@Body() body: any) {
    return this.fcdbbService.addLocation(body);
  }

  @Delete('locations/:id')
  deleteLocation(@Param('id') id: number) {
    return this.fcdbbService.deleteLocation(id);
  }

  @Get('attendance')
  getHistory() { return this.fcdbbService.getHistory(); }

  @Post('attendance/checkin')
  checkin(@Body() body: { playerId: number; locationId: number; distance: number }) {
    return this.fcdbbService.checkin(body.playerId, body.locationId, body.distance);
  }
}