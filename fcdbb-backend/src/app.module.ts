import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { TeamAndGallery1794901000000 } from './migrations/1794901000000-TeamAndGallery';
import { ClubManagement1794900000000 } from './migrations/1794900000000-ClubManagement';
import { AttendanceAndJerseyNumbers1794902000000 } from './migrations/1794902000000-AttendanceAndJerseyNumbers';
import { FcdbbModule } from './fcdbb/fcdbb.module';

function createDatabaseOptions(): TypeOrmModuleOptions {
  const databaseUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      migrations: [
        ClubManagement1794900000000,
        TeamAndGallery1794901000000,
        AttendanceAndJerseyNumbers1794902000000,
      ],
      migrationsRun: true,
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    };
  }

  const databasePath = resolve(
    process.cwd(),
    process.env.SQLITE_DB_PATH || 'data/fcdbb.sqlite',
  );
  mkdirSync(join(databasePath, '..'), { recursive: true });

  return {
    type: 'better-sqlite3',
    database: databasePath,
    autoLoadEntities: true,
    migrations: [AttendanceAndJerseyNumbers1794902000000],
    migrationsRun: true,
    synchronize: true,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    TypeOrmModule.forRoot(createDatabaseOptions()),
    FcdbbModule,
  ],
})
export class AppModule {}
