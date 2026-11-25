import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Req,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { Headers } from '@nestjs/common';
import { FcdbbService } from './fcdbb.service';
import { ClubAuthGuard } from '../football/auth.guard';

@Controller('api')
@UseGuards(ClubAuthGuard)
export class FcdbbController {
  constructor(private readonly srv: FcdbbService) {}

  // API nhịp tim chống ngủ đông
  @Get('ping')
  ping() {
    return { status: 'awake', time: new Date() };
  }

  @Post('auth/login') login(@Body() body: any) {
    return this.srv.login(body.username, body.password);
  }
  @Get('users') getProfiles() {
    return this.srv.getProfiles();
  }
  @Get('users/:id') getProfileById(@Param('id', ParseIntPipe) id: number) {
    return this.srv.getProfileById(id);
  }
  @Post('users') createUser(@Body() body: any) {
    return this.srv.createUser(body);
  }
  @Put('users/:id') updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.srv.updateUser(id, body);
  }
  @Put('users/:id/team') setHomeTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { home_team: unknown },
  ) {
    return this.srv.setHomeTeam(id, body.home_team);
  }
  @Put('users/:id/jersey-number') setJerseyNumber(
    @Param('id', ParseIntPipe) id: number,
    @Body('jersey_number') number: unknown,
  ) {
    return this.srv.setJerseyNumber(id, number);
  }
  @Delete('users/:id') deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.srv.deleteUser(id);
  }
  @Put('users/:id/reset-password') resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { password: string },
  ) {
    return this.srv.resetPassword(id, body.password);
  }
  @Put('users/:id/change-password') changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.srv.changePassword(id, body.currentPassword, body.newPassword);
  }
  @Post('users/:id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.srv.uploadAvatar(id, file);
  }

  @Get('home') getHomeData() {
    return this.srv.getHomeData();
  }

  // Dòng bị thiếu đã được thêm vào đây:
  @Get('matches') getMatches() {
    return this.srv.getMatches();
  }

  @Post('matches') createMatch(@Body() body: any, @Req() req: any) {
    return this.srv.createMatch(body, req.actor);
  }
  @Put('matches/:id') updateMatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.srv.updateMatch(id, body, req.actor);
  }
  @Delete('matches/:id') deleteMatch(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.srv.deleteMatch(id, req.actor);
  }
  @Get('matches/:id/details') getMatchDetails(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.srv.getMatchDetails(id);
  }
  @Post('attendance/checkin') checkin(@Body() body: any, @Req() req: any) {
    return this.srv.checkin(body.matchId, body.lat, body.lng, req.actor);
  }
  @Post('matches/:id/attendance') addManualAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.srv.addManualAttendance(
      id,
      body.userId,
      body.checkedAt,
      req.actor,
    );
  }

  @Get('funds') getFunds() {
    return this.srv.getFunds();
  }

  @Get('blog') getBlogPosts() {
    return this.srv.getBlogPosts();
  }
  @Post('blog')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 12 },
        { name: 'image', maxCount: 1 },
      ],
      {
        limits: { fileSize: 8 * 1024 * 1024, files: 12, fields: 12 },
        fileFilter: (_req, file, cb) => {
          if (
            !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
              file.mimetype,
            )
          )
            return cb(
              new BadRequestException('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.'),
              false,
            );
          cb(null, true);
        },
      },
    ),
  )
  createBlogPost(
    @Body() body: any,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; image?: Express.Multer.File[] },
    @Headers('authorization') authorization?: string,
  ) {
    return this.srv.createBlogPost(
      body,
      [...(files?.images || []), ...(files?.image || [])],
      authorization,
    );
  }
  @Put('blog/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 12 },
        { name: 'image', maxCount: 1 },
      ],
      {
        limits: { fileSize: 8 * 1024 * 1024, files: 12, fields: 12 },
        fileFilter: (_req, file, cb) => {
          if (
            !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
              file.mimetype,
            )
          )
            return cb(
              new BadRequestException('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.'),
              false,
            );
          cb(null, true);
        },
      },
    ),
  )
  updateBlogPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; image?: Express.Multer.File[] },
    @Headers('authorization') authorization?: string,
  ) {
    return this.srv.updateBlogPost(
      id,
      body,
      [...(files?.images || []), ...(files?.image || [])],
      authorization,
    );
  }
  @Delete('blog/:id') deleteBlogPost(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') authorization?: string,
  ) {
    return this.srv.deleteBlogPost(id, authorization);
  }
  @Put('funds/:id') updateFund(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.srv.updateFund(id, body);
  }
  @Delete('funds/:id') deleteFund(@Param('id', ParseIntPipe) id: number) {
    return this.srv.deleteFund(id);
  }
  @Post('funds') @UseInterceptors(FileInterceptor('file')) createFund(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.srv.createFund(body, file);
  }
}
