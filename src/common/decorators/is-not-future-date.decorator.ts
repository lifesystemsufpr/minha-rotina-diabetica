import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';

function hojeLocal(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

// Recusa datas depois de hoje. Compara só a parte AAAA-MM-DD, sem passar por
// Date, para não depender de fuso. Use junto com @IsDateString().
export function IsNotFutureDate(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isNotFutureDate',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && value.slice(0, 10) <= hojeLocal(),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property não pode ser uma data futura`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
