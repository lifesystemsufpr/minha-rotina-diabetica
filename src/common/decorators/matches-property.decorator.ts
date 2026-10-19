import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function MatchesProperty(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'matchesProperty',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [related] = args.constraints as [string];
          return value === (args.object as Record<string, unknown>)[related];
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} deve ser igual a ${String(args.constraints[0])}`;
        },
      },
    });
  };
}
