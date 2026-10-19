import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { dateRangeWhere } from '../../common/utils/date-range';
import { CreateGlycemiaDto } from './dto/create-glycemia.dto';
import {
  GlycemiaResponseDto,
  toGlycemiaResponse,
} from './dto/glycemia-response.dto';
import { ListGlycemiaDto } from './dto/list-glycemia.dto';
import { UpdateGlycemiaDto } from './dto/update-glycemia.dto';
import { Glicemia } from './entities/glicemia.entity';
import { classificarGlicemia } from './utils/classificar-glicemia';

@Injectable()
export class GlycemiaService {
  constructor(
    @InjectRepository(Glicemia)
    private readonly glicemias: Repository<Glicemia>,
  ) {}

  // O status é calculado e gravado junto (persistido), para relatórios e
  // dashboard não precisarem recalcular.
  async create(
    userId: string,
    dto: CreateGlycemiaDto,
  ): Promise<GlycemiaResponseDto> {
    const salva = await this.glicemias.save(
      this.glicemias.create({
        ...dto,
        dataHora: new Date(dto.dataHora),
        status: classificarGlicemia(dto.valor),
        user: { id: userId },
      }),
    );
    return toGlycemiaResponse(salva);
  }

  // Sempre filtrado pelo dono; mais recente primeiro.
  async findAll(
    userId: string,
    filtros: ListGlycemiaDto,
  ): Promise<GlycemiaResponseDto[]> {
    const where: FindOptionsWhere<Glicemia> = { user: { id: userId } };
    const periodo = dateRangeWhere(filtros.startDate, filtros.endDate);
    if (periodo) where.dataHora = periodo;
    if (filtros.momento) where.momento = filtros.momento;

    const lista = await this.glicemias.find({
      where,
      order: { dataHora: 'DESC' },
    });
    return lista.map(toGlycemiaResponse);
  }

  async findOne(userId: string, id: string): Promise<GlycemiaResponseDto> {
    return toGlycemiaResponse(await this.findOwned(userId, id));
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateGlycemiaDto,
  ): Promise<GlycemiaResponseDto> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Informe ao menos um campo para atualizar');
    }
    const glicemia = await this.findOwned(userId, id);
    Object.assign(glicemia, {
      ...dto,
      ...(dto.dataHora ? { dataHora: new Date(dto.dataHora) } : {}),
      ...(dto.valor !== undefined
        ? { status: classificarGlicemia(dto.valor) }
        : {}),
    });
    return toGlycemiaResponse(await this.glicemias.save(glicemia));
  }

  // Exclusão física: o projeto não adota soft delete para registros.
  async remove(userId: string, id: string): Promise<void> {
    await this.glicemias.remove(await this.findOwned(userId, id));
  }

  // id + dono: registro de outro usuário é tratado como inexistente (404),
  // para não revelar que ele existe.
  private async findOwned(userId: string, id: string): Promise<Glicemia> {
    const glicemia = await this.glicemias.findOne({
      where: { id, user: { id: userId } },
    });
    if (!glicemia) {
      throw new NotFoundException('Glicemia não encontrada');
    }
    return glicemia;
  }
}
