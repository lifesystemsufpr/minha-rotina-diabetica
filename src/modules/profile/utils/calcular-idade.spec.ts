import { calcularIdade } from './calcular-idade';

describe('calcularIdade', () => {
  // 08/10/2026, meio-dia no horário local
  const hoje = new Date(2026, 9, 8, 12);

  it('conta o aniversário no próprio dia', () => {
    expect(calcularIdade('2000-10-08', hoje)).toBe(26);
  });

  it('ainda não fez aniversário (amanhã)', () => {
    expect(calcularIdade('2000-10-09', hoje)).toBe(25);
  });

  it('já fez aniversário (ontem)', () => {
    expect(calcularIdade('2000-10-07', hoje)).toBe(26);
  });

  it('mês seguinte ainda não chegou', () => {
    expect(calcularIdade('2000-11-01', hoje)).toBe(25);
  });

  it('devolve null sem data de nascimento', () => {
    expect(calcularIdade(null, hoje)).toBeNull();
    expect(calcularIdade(undefined, hoje)).toBeNull();
    expect(calcularIdade('', hoje)).toBeNull();
  });
});
