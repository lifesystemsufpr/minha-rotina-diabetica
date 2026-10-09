import { registerDecorator, ValidationOptions } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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
          const today = new Date().toISOString().slice(0, 10);
          return value <= today && value >= minDate;
        },
        defaultMessage(): string {
          return `${propertyName} deve ser uma data válida (AAAA-MM-DD), não futura e a partir de ${minDate}`;
        },
      },
    });
  };
}
