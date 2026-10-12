// Valores permitidos, conforme o DER do projeto.
// Se a entidade Insulina já tiver esses enums, importe os dela e apague este arquivo.

export enum InsulinType {
  BASAL = 'basal',
  RAPIDA = 'rapida',
  MISTA = 'mista',
}

export enum ApplicationSite {
  ABDOMEN = 'abdomen',
  BRACO = 'braco',
  COXA = 'coxa',
  OUTRO = 'outro',
}