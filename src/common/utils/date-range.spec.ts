import { FindOperator } from 'typeorm';
import { dateRangeWhere } from './date-range';

describe('dateRangeWhere', () => {
  it('não filtra quando não há datas', () => {
    expect(dateRangeWhere()).toBeUndefined();
  });

  it('só startDate: início inclusivo, às 00:00 do dia', () => {
    const op = dateRangeWhere('2026-10-01') as FindOperator<Date>;
    expect(op.type).toBe('moreThanOrEqual');
    expect(op.value).toEqual(new Date(2026, 9, 1));
  });

  it('só endDate: vai até 00:00 do dia seguinte (exclusivo), cobrindo o dia todo', () => {
    const op = dateRangeWhere(undefined, '2026-10-13') as FindOperator<Date>;
    expect(op.type).toBe('lessThan');
    expect(op.value).toEqual(new Date(2026, 9, 14));
  });

  it('start e end: combina os dois limites', () => {
    const op = dateRangeWhere('2026-10-01', '2026-10-13') as FindOperator<Date>;
    expect(op.type).toBe('and');
    const [inicio, fim] = op.value as unknown as FindOperator<Date>[];
    expect(inicio.type).toBe('moreThanOrEqual');
    expect(inicio.value).toEqual(new Date(2026, 9, 1));
    expect(fim.type).toBe('lessThan');
    expect(fim.value).toEqual(new Date(2026, 9, 14));
  });

  it('startDate igual a endDate cobre exatamente um dia', () => {
    const op = dateRangeWhere('2026-10-13', '2026-10-13') as FindOperator<Date>;
    const [inicio, fim] = op.value as unknown as FindOperator<Date>[];
    expect(inicio.value).toEqual(new Date(2026, 9, 13));
    expect(fim.value).toEqual(new Date(2026, 9, 14));
  });

  it.each([
    ['fim de mês', '2026-10-31', new Date(2026, 10, 1)],
    ['fim de ano', '2026-12-31', new Date(2027, 0, 1)],
    ['ano bissexto', '2028-02-29', new Date(2028, 2, 1)],
  ])(
    'endDate em %s avança corretamente para o dia seguinte',
    (_, endDate, esperado) => {
      const op = dateRangeWhere(undefined, endDate) as FindOperator<Date>;
      expect(op.value).toEqual(esperado);
    },
  );
});
