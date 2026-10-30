import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface GlicemiaRow {
  id: string;
  valor: string;
  momento: string;
  dataHora: Date;
}
export interface InsulinaRow {
  id: string;
  tipo: string;
  doseUi: string;
  localAplicacao: string;
  dataHora: Date;
}
export interface LembreteRow {
  id: string;
  titulo: string;
  dataHora: Date;
}
export interface PontoRow {
  dataHora: Date;
  valor: string;
}

// diz se a data é de hoje (data do servidor)
const ehHoje = (data?: Date) =>
  !!data && data.toDateString() === new Date().toDateString();

@Injectable()
export class HomeService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(userId: string) {
    // todas as consultas filtram por usuario_id, que vem do token
    const [usuario] = await this.dataSource.query<{ nome: string }[]>(
      'SELECT nome FROM usuarios WHERE id = ?',
      [userId],
    );

    // última glicemia do usuário (a mais recente que não foi excluída)
    const [glicemia] = await this.dataSource.query<GlicemiaRow[]>(
      `SELECT id, valor, momento, data_hora AS dataHora FROM glicemias WHERE usuario_id = ? AND deleted_at IS NULL
        ORDER BY data_hora DESC LIMIT 1`,
      [userId],
    );

    // última aplicação de insulina do usuário
    const [insulina] = await this.dataSource.query<InsulinaRow[]>(
      `SELECT id, tipo, dose_ui AS doseUi, local_aplicacao AS localAplicacao, data_hora AS dataHora FROM insulinas
        WHERE usuario_id = ? AND deleted_at IS NULL ORDER BY data_hora DESC LIMIT 1`,
      [userId],
    );

    // só lembrete ATIVO e que ainda não passou
    const [lembrete] = await this.dataSource.query<LembreteRow[]>(
      `SELECT id, titulo, data_hora AS dataHora FROM lembretes WHERE usuario_id = ? AND status = 'ativo' AND data_hora >= NOW()
       ORDER BY data_hora ASC LIMIT 1`,
      [userId],
    );

    // glicemias de hoje e dos 6 dias anteriores, para o gráfico
    const grafico = await this.dataSource.query<PontoRow[]>(
      `SELECT data_hora AS dataHora, valor FROM glicemias WHERE usuario_id = ? AND deleted_at IS NULL
       AND data_hora >= CURDATE() - INTERVAL 6 DAY ORDER BY data_hora ASC`,
      [userId],
    );

    return {
      nome: usuario?.nome ?? null,
      ultimaGlicemia: glicemia
        ? { ...glicemia, valor: Number(glicemia.valor) }
        : null,
      ultimaInsulina: insulina
        ? { ...insulina, doseUi: Number(insulina.doseUi) }
        : null,
      proximoLembrete: lembrete ?? null,

      resumoDiario: {
        glicemiaRegistrada: ehHoje(glicemia?.dataHora),
        insulinaRegistrada: ehHoje(insulina?.dataHora),
      },

      glicemiaUltimos7Dias: grafico.map((p) => ({
        dataHora: p.dataHora,
        valor: Number(p.valor),
      })),
    };
  }
}
