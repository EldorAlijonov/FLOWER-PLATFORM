import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.enableCors({
    origin: Array.from(new Set(allowedOrigins)),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
