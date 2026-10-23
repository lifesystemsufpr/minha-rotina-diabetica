import { StatusGlicemia } from '../enums/status-glicemia.enum';

// Faixa-alvo de 70 a 180 mg/dL: o "tempo no alvo" do Consenso Internacional
// de 2019 (Battelino et al., Diabetes Care), adotado pela ADA e pela SBD.
// Abaixo de 70 é hipoglicemia; acima de 180, hiperglicemia.
export const LIMITE_BAIXA_MG_DL = 70;
export const LIMITE_ALTA_MG_DL = 180;

// O status é sempre calculado pela API, nunca enviado pelo mobile.
export function classificarGlicemia(valor: number): StatusGlicemia {
  if (valor < LIMITE_BAIXA_MG_DL) return StatusGlicemia.BAIXA;
  if (valor > LIMITE_ALTA_MG_DL) return StatusGlicemia.ALTA;
  return StatusGlicemia.NORMAL;
}
