import { BadRequestException, Injectable, OnModuleInit, Param } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { CreateGlycemiaDto } from './dto/create-glycemia.dto';
import { GlycemiaStatus } from './enums/glycemia.enums';
import { ListGlycemiaDto } from './dto/list-glycemia.dto';


const LIMITE_BAIXA = 70;
const LIMITE_ALTA = 180;

@Injectable()
export class GlycemiaService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}


  async onModuleInit() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS glicemias (
        id         VARCHAR(36)  NOT NULL,
        usuario_id VARCHAR(36)  NOT NULL,
        valor      DECIMAL(5,2) NOT NULL,
        momento    ENUM('jejum', 'antes_refeicao', 'pos_refeicao', 'ao_dormir', 'outro') NOT NULL,
        status     ENUM('normal', 'alta', 'baixa') NOT NULL,
        data_hora  DATETIME     NOT NULL,
        observacao VARCHAR(255) NULL,
        created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id))`);
  }


    async create(userId: string, dto: CreateGlycemiaDto){

    const [dia, mes, ano] = dto.data.split('-').map(Number);
    const [hora, minuto] = dto.hora.split(':').map(Number);

    const dataHora = new Date(ano, mes - 1, dia, hora, minuto);


    if ( dataHora.getFullYear() !== ano || dataHora.getMonth() !== mes - 1 || dataHora.getDate() !== dia || dataHora.getHours() !== hora || dataHora.getMinutes() !== minuto) {
        throw new BadRequestException('Data ou hora inválida');
    }

  
    let status: GlycemiaStatus = GlycemiaStatus.NORMAL;

    if (dto.valor < LIMITE_BAIXA) {
        status = GlycemiaStatus.BAIXA;
    } else if (dto.valor > LIMITE_ALTA) {
        status = GlycemiaStatus.ALTA;
    }

    const id = randomUUID();

    await this.dataSource.query(
        `INSERT INTO glicemias(id, usuario_id, valor, momento, status, data_hora, observacao)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,[id,userId,dto.valor,dto.momento,status,dataHora,dto.observacao ?? null,] );

    return {id,valor: dto.valor, momento: dto.momento,  status, dataHora,  observacao: dto.observacao ?? null };
    }

//----------------------------------------------------------------------------------------------------------------------

    
async findAll(userId: string, filtros: ListGlycemiaDto){
  let sql = `SELECT id, valor, momento, status, data_hora AS dataHora, observacao FROM glicemias WHERE usuario_id = ?`;

  const params: unknown[] = [userId];

  if (filtros.startDate){
    const [dia, mes, ano] = filtros.startDate.split('-');
    const dataInicial = `${ano}-${mes}-${dia} 00:00:00`;

    sql += ' AND data_hora >= ?';
    params.push(dataInicial);
  }

  if (filtros.endDate){
    const [dia, mes, ano] = filtros.endDate.split('-');
    const dataFinal = `${ano}-${mes}-${dia}`;

    sql += ' AND data_hora < DATE_ADD(?, INTERVAL 1 DAY)';
    params.push(dataFinal);
  }

  if (filtros.momento){
    sql += ' AND momento = ?';
    params.push(filtros.momento);
  }

  sql += ' ORDER BY data_hora DESC';

  return this.dataSource.query(sql, params);
}

}