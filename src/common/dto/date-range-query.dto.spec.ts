import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DateRangeQueryDto } from './date-range-query.dto';

async function camposComErro(query: Record<string, string>): Promise<string[]> {
  const dto = plainToInstance(DateRangeQueryDto, query);
  const erros = await validate(dto);
  return erros.map((erro) => erro.property);
}

describe('DateRangeQueryDto', () => {
  it('aceita sem nenhuma data', async () => {
    expect(await camposComErro({})).toEqual([]);
  });

  it('aceita apenas startDate', async () => {
    expect(await camposComErro({ startDate: '2026-10-01' })).toEqual([]);
  });

  it('aceita apenas endDate', async () => {
    expect(await camposComErro({ endDate: '2026-10-13' })).toEqual([]);
  });

  it('aceita um intervalo válido', async () => {
    expect(
      await camposComErro({ startDate: '2026-10-01', endDate: '2026-10-13' }),
    ).toEqual([]);
  });

  it('aceita startDate igual a endDate (um único dia)', async () => {
    expect(
      await camposComErro({ startDate: '2026-10-13', endDate: '2026-10-13' }),
    ).toEqual([]);
  });

  it('rejeita endDate anterior a startDate', async () => {
    expect(
      await camposComErro({ startDate: '2026-10-13', endDate: '2026-10-01' }),
    ).toEqual(['endDate']);
  });

  it('rejeita data com horário', async () => {
    expect(
      await camposComErro({ startDate: '2026-10-01T08:00:00Z' }),
    ).toContain('startDate');
  });

  it('rejeita data inexistente', async () => {
    expect(await camposComErro({ startDate: '2026-02-30' })).toContain(
      'startDate',
    );
  });

  it('rejeita formato diferente de AAAA-MM-DD', async () => {
    expect(await camposComErro({ endDate: '13/10/2026' })).toContain('endDate');
  });
});
