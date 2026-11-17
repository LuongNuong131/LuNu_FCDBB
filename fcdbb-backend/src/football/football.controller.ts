import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClubAuthGuard } from './auth.guard';
import { FootballService } from './football.service';

@Controller('api')
@UseGuards(ClubAuthGuard)
export class FootballController {
  constructor(private readonly football: FootballService) {}
  @Get('seasons') seasons() {
    return this.football.getSeasons();
  }
  @Post('seasons') createSeason(@Body() body: any) {
    return this.football.saveSeason(body);
  }
  @Put('seasons/:id') updateSeason(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.football.saveSeason(body, id);
  }
  @Get('competition/matches') list(@Query() query: any) {
    return this.football.list(query);
  }
  @Get('competition/summary') summary(@Query('season') season?: string) {
    return this.football.summary(season);
  }
  @Get('matches/:id/report') report(@Param('id', ParseIntPipe) id: number) {
    return this.football.getReport(id);
  }
  @Put('matches/:id/report') saveReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.football.saveReport(id, body, req.actor);
  }
  @Get('matches/:id/audit') audit(@Param('id', ParseIntPipe) id: number) {
    return this.football.audit(id);
  }
}
