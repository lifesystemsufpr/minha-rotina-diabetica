// Fuso horário padrão da API (decisão do time, nov/2026): os limites de "hoje",
// dos filtros por período e dos totais por dia seguem o horário de Brasília.
// Um TZ definido no ambiente ou no .env tem prioridade (ex.: TZ=UTC).
export const FUSO_PADRAO = 'America/Sao_Paulo';

export function aplicarFusoPadrao(): void {
  process.env.TZ ||= FUSO_PADRAO;
}
