import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FcdbbModule } from './fcdbb/fcdbb.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // Render sẽ truyền 1 chuỗi URL này vào là xong
      autoLoadEntities: true,
      synchronize: false,
      ssl: { rejectUnauthorized: false }, // Bắt buộc phải có để Render không bị Supabase từ chối
    }),
    FcdbbModule,
  ],
})
export class AppModule {}