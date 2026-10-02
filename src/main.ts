import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      // remove do payload qualquer propriedade que não esteja no DTO
      whitelist: true,
      // se vier propriedade extra não prevista no DTO, rejeita com 400
      // (em vez de silenciosamente ignorar)
      forbidNonWhitelisted: true,
      // converte tipos primitivos (string -> number, string -> Date, etc)
      // de acordo com o tipo declarado no DTO
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS para o desenvolvimento do mobile (manual da Sprint 1, §12)
  app.enableCors();

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
