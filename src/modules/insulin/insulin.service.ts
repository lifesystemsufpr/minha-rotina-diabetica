import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { CreateInsulinDto } from './dto/create-insulin.dto';
import { ListInsulinDto } from './dto/list-insulin.dto';
import { UpdateInsulinDto } from './dto/update-insulin.dto';

@Injectable()
export class InsulinService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query(`

      CREATE TABLE IF NOT EXISTS insulinas (
        id              VARCHAR(36)  NOT NULL,
        usuario_id      VARCHAR(36)  NOT NULL,
        tipo            ENUM('basal', 'rapida', 'mista') NOT NULL,
        dose_ui         DECIMAL(6,2) NOT NULL,
        local_aplicacao ENUM('abdomen', 'braco', 'coxa', 'outro') NOT NULL,
        data_hora       DATETIME     NOT NULL,
        observacao      VARCHAR(255) NULL,
        created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                     ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id)
      )
    `);
  }

  async create(userId: string, dto: CreateInsulinDto) {
    const id = randomUUID();

    await this.dataSource.query(
      `INSERT INTO insulinas
        (id, usuario_id, tipo, dose_ui, local_aplicacao, data_hora, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        dto.tipo,
        dto.doseUi,
        dto.localAplicacao,
        new Date(dto.dataHora),
        dto.observacao ?? null,
      ],
    );

    return { id, ...dto };
  }

  async findAll(userId: string, filtros: ListInsulinDto) {
    let sql = `
    SELECT id, tipo, dose_ui AS doseUi, local_aplicacao AS localAplicacao, data_hora AS dataHora, observacao
    FROM insulinas WHERE usuario_id = ?
 `;

    const params: unknown[] = [userId];

    if (filtros.startDate) {
      sql += ' AND data_hora >= ?';
      params.push(new Date(filtros.startDate));
    }

    if (filtros.endDate) {
      sql += ' AND data_hora <= ?';
      params.push(new Date(filtros.endDate));
    }

    if (filtros.tipo) {
      sql += ' AND tipo = ?';
      params.push(filtros.tipo);
    }

    sql += ' ORDER BY data_hora DESC';

    const linhas = await this.dataSource.query(sql, params);

    return linhas.map((l: { doseUi: string }) => ({
      ...l,
      doseUi: Number(l.doseUi),
    }));
  }

  //--------------------------------------------------------------------------------------

  async findOne(userId: string, id: string) {
    const resultado = await this.dataSource.query(
      `SELECT id, tipo, dose_ui AS doseUi, local_aplicacao AS localAplicacao, data_hora AS dataHora, observacao
       FROM insulinas WHERE id = ? AND usuario_id = ?`,
      [id, userId],
    );

    if (resultado.length === 0) {
      throw new NotFoundException('Aplicação não encontrada');
    }

    return resultado[0];
  }

  async update(userId: string, id: string, dto: UpdateInsulinDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Informe um campo para atualizar');
    }

    await this.findOne(userId, id);

    const campos: string[] = [];
    const valores: unknown[] = [];

    if (dto.tipo !== undefined) {
      campos.push('tipo = ?');
      valores.push(dto.tipo);
    }

    if (dto.doseUi !== undefined) {
      campos.push('dose_ui = ?');
      valores.push(dto.doseUi);
    }

    if (dto.localAplicacao !== undefined) {
      campos.push('local_aplicacao = ?');
      valores.push(dto.localAplicacao);
    }

    if (dto.dataHora !== undefined) {
      campos.push('data_hora = ?');
      valores.push(new Date(dto.dataHora));
    }

    if (dto.observacao !== undefined) {
      campos.push('observacao = ?');
      valores.push(dto.observacao);
    }

    valores.push(id, userId);

    await this.dataSource.query(
      `UPDATE insulinas SET ${campos.join(', ')}
       WHERE id = ? AND usuario_id = ?`,
      valores,
    );

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.dataSource.query(
      ' DELETE FROM insulinas WHERE id = ? AND usuario_id = ? ',
      [id, userId],
    );

    return { message: 'Aplicação excluída com sucesso' };
  }
}
