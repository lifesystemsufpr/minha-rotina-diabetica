import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Valida que a data do campo anotado não é anterior à data de outro campo do
// mesmo objeto. Só compara quando os dois estão preenchidos e no formato
// AAAA-MM-DD (os outros validadores reportam formato inválido). Nesse formato,
// a ordem alfabética das strings é igual à ordem cronológica.
export function IsNotBeforeProperty(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotBeforeProperty',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedName] = args.constraints as [string];
          const related = (args.object as Record<string, unknown>)[relatedName];
          if (typeof value !== 'string' || typeof related !== 'string') {
            return true;
          }
          if (!DATE_ONLY.test(value) || !DATE_ONLY.test(related)) {
            return true;
          }
          return value >= related;
        },
      },
    });
  };
}
