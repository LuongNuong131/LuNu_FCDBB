import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FcdbbModule } from './fcdbb/fcdbb.module';

@Module({
  imports: [
    // 1. Cấu hình đọc biến môi trường (.env trên local hoặc Environment Variables trên Render)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Cấu hình phục vụ file tĩnh để xem ảnh avatar, chứng từ quỹ đội
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),

    // 3. Cấu hình JWT (Xác thực đăng nhập cho ứng dụng)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fcdbb_fallback_secret_key',
        signOptions: { expiresIn: '1d' },
      }),
    }),

    // 4. Cấu hình lõi Database (PostgreSQL) thông minh
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        
        return {
          type: 'postgres',
          // Sử dụng DATABASE_URL từ Render, nếu không có thì chạy local fallback
          url: dbUrl || 'postgresql://postgres:password@127.0.0.1:5432/fcdbb',
          autoLoadEntities: true,
          synchronize: true, // Tự động đồng bộ schema (rất tiện cho giai đoạn development)
          // Rất quan trọng: Bắt buộc bật SSL để vượt qua tường lửa của Cloud Database
          ssl: dbUrl ? { rejectUnauthorized: false } : false,
        };
      },
    }),

    // 5. Module nghiệp vụ chính
    FcdbbModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}