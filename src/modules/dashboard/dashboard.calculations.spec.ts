import { GlycemiaResponseDto } from '../glycemia/dto/glycemia-response.dto';
import { MomentoGlicemia } from '../glycemia/enums/momento-glicemia.enum';
import { StatusGlicemia } from '../glycemia/enums/status-glicemia.enum';
import { InsulinResponseDto } from '../insulin/dto/insulin-response.dto';
import {
  calcularMedia,
  encontrarMaior,
  encontrarMenor,
  montarSerieGlicemia,
  totalizarInsulinaPorDia,
} from './dashboard.calculations';

const [momentoA, momentoB] = Object.values(MomentoGlicemia);
const status = Object.values(StatusGlicemia)[0];

const glicemia = (
  valor: number,
  dataHora: Date,
  momento: MomentoGlicemia = momentoA,
): GlycemiaResponseDto => ({
  id: `g-${valor}-${dataHora.getTime()}`,
  valor,
  momento,
  status,
  dataHora,
  observacao: null,
});

const insulina = (doseUi: number, dataHora: Date): InsulinResponseDto => ({
  id: `i-${doseUi}-${dataHora.getTime()}`,
  tipo: 'Rápida',
  doseUi,
  localAplicacao: null,
  dataHora,
  observacao: null,
});

describe('calcularMedia', () => {
  it('calcula a média das glicemias', () => {
    const lista = [100, 120, 140].map((v) =>
      glicemia(v, new Date(2026, 9, 12, 8, 0)),
    );
    expect(calcularMedia(lista)).toBe(120);
  });

  it('arredonda para 2 casas decimais', () => {
    const lista = [100, 101, 101].map((v) =>
      glicemia(v, new Date(2026, 9, 12, 8, 0)),
    );
    expect(calcularMedia(lista)).toBe(100.67);
  });

  it('retorna null sem registros (sem divisão por zero)', () => {
    expect(calcularMedia([])).toBeNull();
  });
});

describe('maior e menor valor', () => {
  const lista = [
    glicemia(110, new Date(2026, 9, 12, 8, 0), momentoA),
    glicemia(250, new Date(2026, 9, 12, 13, 0), momentoB),
    glicemia(60, new Date(2026, 9, 13, 7, 0), momentoA),
  ];

  it('retorna o maior valor com data e momento', () => {
    expect(encontrarMaior(lista)).toEqual({
      valor: 250,
      dataHora: new Date(2026, 9, 12, 13, 0),
      momento: momentoB,
    });
  });

  it('retorna o menor valor com data e momento', () => {
    expect(encontrarMenor(lista)).toEqual({
      valor: 60,
      dataHora: new Date(2026, 9, 13, 7, 0),
      momento: momentoA,
    });
  });

  it('em caso de empate vence o registro mais recente, em qualquer ordem', () => {
    const antiga = glicemia(200, new Date(2026, 9, 10, 8, 0));
    const recente = glicemia(200, new Date(2026, 9, 12, 8, 0), momentoB);

    expect(encontrarMaior([antiga, recente])?.dataHora).toEqual(
      recente.dataHora,
    );
    expect(encontrarMaior([recente, antiga])?.dataHora).toEqual(
      recente.dataHora,
    );
    expect(encontrarMenor([antiga, recente])?.dataHora).toEqual(
      recente.dataHora,
    );
  });

  it('retorna null sem registros', () => {
    expect(encontrarMaior([])).toBeNull();
    expect(encontrarMenor([])).toBeNull();
  });
});

describe('montarSerieGlicemia', () => {
  it('ordena em ordem cronológica crescente', () => {
    const lista = [
      glicemia(130, new Date(2026, 9, 12, 20, 0)),
      glicemia(90, new Date(2026, 9, 12, 7, 0)),
      glicemia(110, new Date(2026, 9, 12, 12, 0)),
    ];
    expect(montarSerieGlicemia(lista).map((p) => p.valor)).toEqual([
      90, 110, 130,
    ]);
  });

  it('retorna lista vazia sem registros', () => {
    expect(montarSerieGlicemia([])).toEqual([]);
  });
});

describe('totalizarInsulinaPorDia', () => {
  it('soma as doses por dia, em ordem cronológica', () => {
    const lista = [
      insulina(10, new Date(2026, 9, 13, 8, 0)),
      insulina(4, new Date(2026, 9, 12, 22, 0)),
      insulina(6, new Date(2026, 9, 12, 7, 0)),
    ];
    expect(totalizarInsulinaPorDia(lista)).toEqual([
      { data: '2026-10-12', totalUi: 10 },
      { data: '2026-10-13', totalUi: 10 },
    ]);
  });

  it('arredonda a soma (0,1 + 0,2 = 0,3)', () => {
    const lista = [
      insulina(0.1, new Date(2026, 9, 12, 8, 0)),
      insulina(0.2, new Date(2026, 9, 12, 9, 0)),
    ];
    expect(totalizarInsulinaPorDia(lista)[0].totalUi).toBe(0.3);
  });

  it('separa 23:59 e 00:01 em dias diferentes', () => {
    const lista = [
      insulina(5, new Date(2026, 9, 12, 23, 59)),
      insulina(5, new Date(2026, 9, 13, 0, 1)),
    ];
    expect(totalizarInsulinaPorDia(lista).map((t) => t.data)).toEqual([
      '2026-10-12',
      '2026-10-13',
    ]);
  });

  it('retorna lista vazia sem registros', () => {
    expect(totalizarInsulinaPorDia([])).toEqual([]);
  });
});
