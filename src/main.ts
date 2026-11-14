import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { setupSwagger } from './config/swagger.config';
import { aplicarFusoPadrao } from './config/timezone';

async function bootstrap() {
  // Depois dos imports: o ConfigModule já carregou o .env, então um TZ
  // definido lá continua valendo.
  aplicarFusoPadrao();
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
