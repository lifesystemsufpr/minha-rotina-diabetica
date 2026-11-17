import { MomentoGlicemia } from '../enums/momento-glicemia.enum';
import { StatusGlicemia } from '../enums/status-glicemia.enum';
import {
  classificarGlicemia,
  isHipoglicemiaNivel2,
} from './classificar-glicemia';

describe('classificarGlicemia', () => {
  describe.each([
    MomentoGlicemia.JEJUM,
    MomentoGlicemia.ANTES_CAFE,
    MomentoGlicemia.ANTES_ALMOCO,
    MomentoGlicemia.ANTES_JANTAR,
  ])('momento pré-prandial %s (teto 130 mg/dL)', (momento) => {
    it.each([
      [69, StatusGlicemia.BAIXA],
      [70, StatusGlicemia.NORMAL],
      [75, StatusGlicemia.NORMAL],
      [130, StatusGlicemia.NORMAL],
      [131, StatusGlicemia.ALTA],
      [180, StatusGlicemia.ALTA],
      [181, StatusGlicemia.ALTA],
    ])('%s mg/dL -> %s', (valor, status) => {
      expect(classificarGlicemia(valor, momento)).toBe(status);
    });
  });

  describe.each([
    MomentoGlicemia.APOS_CAFE,
    MomentoGlicemia.APOS_ALMOCO,
    MomentoGlicemia.APOS_JANTAR,
  ])('momento pós-prandial %s (teto 180 mg/dL)', (momento) => {
    it.each([
      [69, StatusGlicemia.BAIXA],
      [70, StatusGlicemia.NORMAL],
      [130, StatusGlicemia.NORMAL],
      [131, StatusGlicemia.NORMAL],
      [150, StatusGlicemia.NORMAL],
      [180, StatusGlicemia.NORMAL],
      [181, StatusGlicemia.ALTA],
    ])('%s mg/dL -> %s', (valor, status) => {
      expect(classificarGlicemia(valor, momento)).toBe(status);
    });
  });

  it('momento futuro sem meta específica usa teto de 180 mg/dL', () => {
    const momentoFuturo = 'OUTRO_MOMENTO' as MomentoGlicemia;
    expect(classificarGlicemia(69, momentoFuturo)).toBe(StatusGlicemia.BAIXA);
    expect(classificarGlicemia(180, momentoFuturo)).toBe(StatusGlicemia.NORMAL);
    expect(classificarGlicemia(181, momentoFuturo)).toBe(StatusGlicemia.ALTA);
  });
});

describe('isHipoglicemiaNivel2', () => {
  it.each([
    [53, true],
    [53.9, true],
    [54, false],
    [70, false],
  ])('%s mg/dL -> %s', (valor, esperado) => {
    expect(isHipoglicemiaNivel2(valor)).toBe(esperado);
  });
});
