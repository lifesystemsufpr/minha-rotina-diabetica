import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

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
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
