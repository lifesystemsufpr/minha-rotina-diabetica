import { registerDecorator, ValidationOptions } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Data de hoje (AAAA-MM-DD) no fuso do servidor, sem converter para UTC.
function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function IsNotFutureDate(
  minDate = '1900-01-01',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' || !DATE_ONLY.test(value)) return false;
          const parsed = new Date(`${value}T00:00:00.000Z`);
          // rejeita datas inexistentes (ex.: 2026-02-30)
          if (
            Number.isNaN(parsed.getTime()) ||
            parsed.toISOString().slice(0, 10) !== value
          ) {
            return false;
          }
          return value <= todayLocal() && value >= minDate;
        },
        defaultMessage(): string {
          return `${propertyName} deve ser uma data válida (AAAA-MM-DD), não futura e a partir de ${minDate}`;
        },
      },
    });
  };
}
