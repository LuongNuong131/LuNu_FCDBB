import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FcdbbService } from './fcdbb.service';

@Controller('fcdbb')
export class FcdbbController {
  constructor(private readonly fcdbbService: FcdbbService) {}

  @Get('ping')
  ping() {
    return { status: 'awake', time: new Date() };
  }

  @Post()
  create(@Body() createFcdbbDto: any) {
    return this.fcdbbService.create(createFcdbbDto);
  }

  @Get()
  findAll() {
    return this.fcdbbService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fcdbbService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFcdbbDto: any) {
    return this.fcdbbService.update(+id, updateFcdbbDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fcdbbService.remove(+id);
  }
}