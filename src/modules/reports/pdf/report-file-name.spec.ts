import { buildReportFileName } from './report-file-name';

describe('buildReportFileName', () => {
  it('usa início e fim do período', () => {
    expect(buildReportFileName('2026-10-01', '2026-10-13')).toBe(
      'relatorio-rotina-diabetica_2026-10-01_a_2026-10-13.pdf',
    );
  });

  it('só início', () => {
    expect(buildReportFileName('2026-10-01')).toBe(
      'relatorio-rotina-diabetica_2026-10-01_a_hoje.pdf',
    );
  });

  it('só fim', () => {
    expect(buildReportFileName(undefined, '2026-10-13')).toBe(
      'relatorio-rotina-diabetica_inicio_a_2026-10-13.pdf',
    );
  });

  it('sem período', () => {
    expect(buildReportFileName()).toBe(
      'relatorio-rotina-diabetica_completo.pdf',
    );
  });
});