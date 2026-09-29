import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorDetails {
  field?: string;
  message: string;
}

export class ApiErrorException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    details?: ApiErrorDetails[],
  ) {
    super({ statusCode, message, details: details ?? [] }, statusCode);
  }
}