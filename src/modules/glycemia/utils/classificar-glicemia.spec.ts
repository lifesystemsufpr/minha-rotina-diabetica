import { StatusGlicemia } from '../enums/status-glicemia.enum';
import { classificarGlicemia } from './classificar-glicemia';

describe('classificarGlicemia', () => {
  it.each([
    [69, StatusGlicemia.BAIXA],
    [70, StatusGlicemia.NORMAL],
    [110, StatusGlicemia.NORMAL],
    [180, StatusGlicemia.NORMAL],
    [181, StatusGlicemia.ALTA],
  ])('%s mg/dL -> %s', (valor, status) => {
    expect(classificarGlicemia(valor)).toBe(status);
  });
});
