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
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @Post('attendance/checkin') checkin(@Body() body: any) {
    return this.srv.checkin(body.userId, body.matchId, body.lat, body.lng);
  }

  @Get('funds') getFunds() {
    return this.srv.getFunds();
  }

  @Get('blog') getBlogPosts() {
    return this.srv.getBlogPosts();
  }
  @Post('blog') @UseInterceptors(FileInterceptor('image')) createBlogPost(
    @Body() body: any,
    @UploadedFile() image: Express.Multer.File,
    @Headers('authorization') authorization?: string,
  ) {
    return this.srv.createBlogPost(body, image, authorization);
  }
  @Put('blog/:id') @UseInterceptors(FileInterceptor('image')) updateBlogPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() image: Express.Multer.File,
    @Headers('authorization') authorization?: string,
  ) {
    return this.srv.updateBlogPost(id, body, image, authorization);
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
