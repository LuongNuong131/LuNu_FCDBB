import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { FcdbbModule } from './fcdbb/fcdbb.module';

function createDatabaseOptions(): TypeOrmModuleOptions {
  const databaseUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    };
  }

  const databasePath = join(
    process.cwd(),
    process.env.SQLITE_DB_PATH || 'data/fcdbb.sqlite',
  );
  mkdirSync(join(databasePath, '..'), { recursive: true });

  return {
    type: 'better-sqlite3',
    database: databasePath,
    autoLoadEntities: true,
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
