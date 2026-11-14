import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Erro de um campo específico do payload (validação).
 */
export class FieldErrorDto {
  @ApiProperty({
    example: 'email',
    description:
      'Campo com erro. Campos aninhados usam ponto: "contato.telefone"',
  })
  field!: string;

  @ApiProperty({ example: ['email must be an email'] })
  messages!: string[];
}

/**
 * Formato padrão de erro retornado por TODA a API.
 *
 * O mobile deve sempre ler:
 *  - `message` -> texto principal para exibir ao usuário
 *  - `details` -> lista de erros por campo, quando existir (validação)
 *  - `code`    -> código estável para o app decidir o que fazer, quando
 *                 existir (ex.: PERFIL_INCOMPLETO). Não mude o texto de
 *                 `message` para tomar decisão no app; use o `code`.
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Código HTTP do erro' })
  statusCode!: number;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Nome curto do erro HTTP',
  })
  error!: string;

  @ApiProperty({
    example: 'Erro de validação',
    description:
      'Mensagem principal. Em validação é um resumo; em erro de negócio, a mensagem específica',
  })
  message!: string;

  @ApiProperty({ example: '2026-10-02T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({
    example: '/api/users',
    description: 'Caminho da requisição, sem query string',
  })
  path!: string;

  @ApiProperty({ example: 'POST' })
  method!: string;

  @ApiPropertyOptional({
    example: 'PERFIL_INCOMPLETO',
    description: 'Código estável do erro de negócio, quando houver',
  })
  code?: string;

  @ApiPropertyOptional({ type: [FieldErrorDto] })
  details?: FieldErrorDto[];
}
