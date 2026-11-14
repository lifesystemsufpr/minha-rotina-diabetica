import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsOptional } from 'class-validator';

// O contato de emergência foi removido do produto (nov/2026). Versões do app
// que ainda enviam `contatoEmergencia` continuam funcionando: o campo é
// aceito, mas IGNORADO (não é validado, gravado nem devolvido).
// Remover este decorator quando o app parar de enviar o campo.
export function ContatoEmergenciaDescontinuado() {
  return applyDecorators(
    ApiPropertyOptional({
      deprecated: true,
      type: Object,
      description:
        'Descontinuado: aceito apenas por compatibilidade e ignorado pela API.',
    }),
    IsOptional(),
    Allow(),
  );
}
