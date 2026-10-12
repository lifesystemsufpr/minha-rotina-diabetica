import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { CreateInsulinDto } from './dto/create-insulin.dto';

@Injectable()
export class InsulinService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  // Roda uma vez quando a API sobe: cria a tabela se ela não existir
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

  // Grava a aplicação para o usuário que veio do token
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
}