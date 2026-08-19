import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // MỞ CORS CHO FE VERCEL GỌI ĐƯỢC API
  app.enableCors({
    origin: '*', // Sau này deploy xong, bạn có thể đổi '*' thành 'https://ten-web-cua-ban.vercel.app' cho bảo mật
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Render sẽ tự cấp PORT, nếu ở local thì chạy 3000
  await app.listen(process.env.PORT || 3000);
}
bootstrap();