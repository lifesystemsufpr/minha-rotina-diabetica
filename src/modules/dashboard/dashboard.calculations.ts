import { GlycemiaResponseDto } from '../glycemia/dto/glycemia-response.dto';
import { InsulinResponseDto } from '../insulin/dto/insulin-response.dto';
import {
  PontoGlicemiaDto,
  TotalInsulinaDiarioDto,
} from './dto/dashboard-response.dto';

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// 'AAAA-MM-DD' do dia no fuso do servidor (mesma convenção do filtro por período).
function diaDe(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function paraPonto(glicemia: GlycemiaResponseDto): PontoGlicemiaDto {
  return {
    valor: glicemia.valor,
    dataHora: glicemia.dataHora,
    momento: glicemia.momento,
  };
}

export function calcularMedia(glicemias: GlycemiaResponseDto[]): number | null {
  if (glicemias.length === 0) return null;
  const soma = glicemias.reduce((total, g) => total + g.valor, 0);
  return arredondar(soma / glicemias.length);
}

// Empate no valor: vence o registro mais recente, qualquer que seja a ordem da lista.
function encontrarExtremo(
  glicemias: GlycemiaResponseDto[],
  vence: (candidato: number, atual: number) => boolean,
): PontoGlicemiaDto | null {
  let escolhida: GlycemiaResponseDto | null = null;
  for (const glicemia of glicemias) {
    if (
      escolhida === null ||
      vence(glicemia.valor, escolhida.valor) ||
      (glicemia.valor === escolhida.valor &&
        glicemia.dataHora.getTime() > escolhida.dataHora.getTime())
    ) {
      escolhida = glicemia;
    }
  }
  return escolhida ? paraPonto(escolhida) : null;
}

export function encontrarMaior(
  glicemias: GlycemiaResponseDto[],
): PontoGlicemiaDto | null {
  return encontrarExtremo(glicemias, (candidato, atual) => candidato > atual);
}

export function encontrarMenor(
  glicemias: GlycemiaResponseDto[],
): PontoGlicemiaDto | null {
  return encontrarExtremo(glicemias, (candidato, atual) => candidato < atual);
}

// Ordem cronológica crescente, a que um gráfico espera.
export function montarSerieGlicemia(
  glicemias: GlycemiaResponseDto[],
): PontoGlicemiaDto[] {
  return [...glicemias]
    .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
    .map(paraPonto);
}

export function totalizarInsulinaPorDia(
  insulinas: InsulinResponseDto[],
): TotalInsulinaDiarioDto[] {
  const totais = new Map<string, number>();
  for (const insulina of insulinas) {
    const dia = diaDe(insulina.dataHora);
    totais.set(dia, (totais.get(dia) ?? 0) + insulina.doseUi);
  }
  return [...totais.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, total]) => ({ data, totalUi: arredondar(total) }));
}
