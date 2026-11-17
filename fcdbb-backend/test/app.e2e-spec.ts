import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { FcdbbModule } from '../src/fcdbb/fcdbb.module';

describe('Application health', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        FcdbbModule,
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });
  it('exposes the actual public health endpoint without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ping')
      .expect(200);
    expect(response.body.status).toBe('awake');
    expect(Number.isNaN(Date.parse(response.body.time))).toBe(false);
  });
});
