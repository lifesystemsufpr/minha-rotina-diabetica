// Nome previsível: relatorio-rotina-diabetica_2026-10-01_a_2026-10-13.pdf
// As datas já chegam validadas (AAAA-MM-DD) pelo DateRangeQueryDto, então o
// nome só tem caracteres seguros para o header Content-Disposition.
export function buildReportFileName(
  startDate?: string,
  endDate?: string,
): string {
  const periodo =
    startDate || endDate
      ? `${startDate ?? 'inicio'}_a_${endDate ?? 'hoje'}`
      : 'completo';
  return `relatorio-rotina-diabetica_${periodo}.pdf`;
}