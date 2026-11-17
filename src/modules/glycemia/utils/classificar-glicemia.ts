import { MomentoGlicemia } from '../enums/momento-glicemia.enum';
import { StatusGlicemia } from '../enums/status-glicemia.enum';

// Metas de glicemia capilar da Diretriz SBD Ed. 2026 ("Metas de controle
// glicêmico", DOI 10.29327/5881296.2026-1):
// - Abaixo de 70 mg/dL: BAIXA (hipoglicemia) em qualquer momento;
// - Abaixo de 54 mg/dL: hipoglicemia nível 2;
// - Jejum e pré-prandial: teto de 130 mg/dL;
// - Pós-prandial (e momentos futuros sem meta específica): teto de 180 mg/dL.
export const LIMITE_HIPOGLICEMIA_NIVEL_2_MG_DL = 54;
export const LIMITE_BAIXA_MG_DL = 70;
export const LIMITE_ALTA_PRE_PRANDIAL_MG_DL = 130;
export const LIMITE_ALTA_POS_PRANDIAL_MG_DL = 180;
export const LIMITE_ALTA_MG_DL = 180;

const MOMENTOS_PRE_PRANDIAIS: ReadonlySet<MomentoGlicemia> = new Set([
  MomentoGlicemia.JEJUM,
  MomentoGlicemia.ANTES_CAFE,
  MomentoGlicemia.ANTES_ALMOCO,
  MomentoGlicemia.ANTES_JANTAR,
]);

export function tetoMetaGlicemia(momento: MomentoGlicemia): number {
  return MOMENTOS_PRE_PRANDIAIS.has(momento)
    ? LIMITE_ALTA_PRE_PRANDIAL_MG_DL
    : LIMITE_ALTA_POS_PRANDIAL_MG_DL;
}

// O status é sempre calculado pela API, nunca enviado pelo mobile.
export function classificarGlicemia(
  valor: number,
  momento: MomentoGlicemia,
): StatusGlicemia {
  if (valor < LIMITE_BAIXA_MG_DL) return StatusGlicemia.BAIXA;
  if (valor > tetoMetaGlicemia(momento)) return StatusGlicemia.ALTA;
  return StatusGlicemia.NORMAL;
}

export function isHipoglicemiaNivel2(valor: number): boolean {
  return valor < LIMITE_HIPOGLICEMIA_NIVEL_2_MG_DL;
}
