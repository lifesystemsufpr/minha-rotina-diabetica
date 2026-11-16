import { TransformFnParams } from 'class-transformer';

// Tipos de insulina segundo a Diretriz SBD Ed. 2026 ("Insulinoterapia no DM1",
// tabela 1, última revisão 25/01/2022).
export enum TipoInsulina {
  ULTRARRAPIDA = 'ULTRARRAPIDA',
  RAPIDA = 'RAPIDA',
  INTERMEDIARIA = 'INTERMEDIARIA',
  LONGA = 'LONGA',
  ULTRALONGA = 'ULTRALONGA',
  PRE_MISTURADA = 'PRE_MISTURADA',
}

export const ROTULO_TIPO_INSULINA: Record<TipoInsulina, string> = {
  [TipoInsulina.ULTRARRAPIDA]:
    'Ultrarrápida (lispro, asparte, glulisina, Fiasp)',
  [TipoInsulina.RAPIDA]: 'Rápida (regular)',
  [TipoInsulina.INTERMEDIARIA]: 'Intermediária (NPH, detemir)',
  [TipoInsulina.LONGA]: 'Longa (glargina U100)',
  [TipoInsulina.ULTRALONGA]: 'Ultralonga (degludeca, glargina U300)',
  [TipoInsulina.PRE_MISTURADA]: 'Pré-misturada (70/30, Mix)',
};

// Rótulos antigos do app já instalado (comparados com trim + minúsculas).
export const ROTULO_ANTIGO_PARA_TIPO_INSULINA: Record<string, TipoInsulina> = {
  rápida: TipoInsulina.ULTRARRAPIDA,
  regular: TipoInsulina.RAPIDA,
  nph: TipoInsulina.INTERMEDIARIA,
  'longa duração': TipoInsulina.LONGA,
};

export function converterTipoInsulina(valor: unknown): unknown {
  if (typeof valor !== 'string') return valor;
  const limpo = valor.trim();
  const convertido = ROTULO_ANTIGO_PARA_TIPO_INSULINA[limpo.toLowerCase()];
  return convertido ?? limpo;
}

export const normalizarTipoInsulina = ({
  obj,
  key,
}: TransformFnParams): unknown =>
  converterTipoInsulina((obj as Record<string, unknown>)[key]);

export function formatarTipoInsulina(tipo: string): string {
  return (
    (ROTULO_TIPO_INSULINA as Record<string, string | undefined>)[tipo] ?? tipo
  );
}
