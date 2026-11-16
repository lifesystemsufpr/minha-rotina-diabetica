import { registerDecorator, ValidationOptions } from 'class-validator';

// Tolerância para diferença de relógio entre o aparelho e o servidor.
export const TOLERANCIA_FUTURO_MINUTOS = 5;

// Data e hora (ISO 8601) que já aconteceu. Medição e aplicação de insulina são
// registros do que foi feito, então não podem estar no futuro. Lembretes não
// usam esta regra.
export function IsNotFutureDateTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDateTime',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const instante = new Date(value).getTime();
          if (Number.isNaN(instante)) return false;
          return instante <= Date.now() + TOLERANCIA_FUTURO_MINUTOS * 60_000;
        },
        defaultMessage(): string {
          return `${propertyName} não pode estar no futuro`;
        },
      },
    });
  };
}
