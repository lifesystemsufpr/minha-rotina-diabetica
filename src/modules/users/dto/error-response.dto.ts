/**
 * Formato padrão de erro retornado por TODA a API.
 *
 * * O mobile deve sempre ler:
 *  - `message`  -> texto amigável para exibir ao usuário (ou o primeiro erro)
 *  - `details`  -> lista de erros por campo, quando existir (validação)
 */
export class ErrorResponseDto {
  /** Código HTTP do erro. Ex.: 400, 401, 403, 404, 409, 500 */
  statusCode!: number;

  /** Nome curto do erro HTTP. Ex.: "Bad Request", "Not Found" */
  error!: string;

  /**
   * Mensagem principal, legível por humanos.
   * Para erros de validação, é um resumo (ex.: "Erro de validação").
   * Para erros de negócio, é a mensagem específica (ex.: "E-mail já cadastrado").
   */
  message!: string;
  timestamp!: string;
  path!: string;
  method!: string;

  details?: FieldValidationErrorDto[];
}

/**
 * Erro de validação de um campo específico do payload.
 */
export class FieldValidationErrorDto {
  field!: string;
  messages!: string[];
}