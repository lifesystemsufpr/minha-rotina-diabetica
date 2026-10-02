import { INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { createValidationPipe } from './common/pipes/app-validation.pipe';

// Configuração global da API. Usada pelo main.ts e pelos testes e2e, para os
// testes exercitarem exatamente o mesmo prefixo, validação e formato de erro.
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');

  // CORS para o desenvolvimento do mobile (manual da Sprint 1, §12).
  // Sem CORS_ORIGIN, aceita qualquer origem; em produção, defina a lista.
  const corsOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins?.length ? corsOrigins : true });

  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
}
