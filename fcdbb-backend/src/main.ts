import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Mở chốt chặn CORS để Vercel Frontend có thể gọi được API
  app.enableCors({
    origin: '*', // Khi lên production, bạn có thể thay '*' bằng link Vercel của bạn cho bảo mật
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Sử dụng PORT của Render cấp, nếu chạy local thì dùng 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Backend FCDBB is running on port: ${port}`);
}
bootstrap();