import { TransformFnParams } from 'class-transformer';

const rawValue = ({ obj, key }: TransformFnParams): unknown =>
  (obj as Record<string, unknown>)[key];

// Mantém o valor bruto (usar em senhas: sem trim, sem conversão).
export const raw = (params: TransformFnParams): unknown => rawValue(params);

export const trim = (params: TransformFnParams): unknown => {
  const value = rawValue(params);
  return typeof value === 'string' ? value.trim() : value;
};

export const trimLowercase = (params: TransformFnParams): unknown => {
  const value = rawValue(params);
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
};

// Aceita number ou string numérica ("170.5"); o resto é rejeitado por @IsNumber.
export const toNumber = (params: TransformFnParams): unknown => {
  const value = rawValue(params);
  return typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;
};
