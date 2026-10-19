import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { dateRangeWhere } from '../../common/utils/date-range';
import { CreateInsulinDto } from './dto/create-insulin.dto';
import {
  InsulinResponseDto,
  toInsulinResponse,
} from './dto/insulin-response.dto';
import { ListInsulinDto } from './dto/list-insulin.dto';
import { UpdateInsulinDto } from './dto/update-insulin.dto';
import { Insulina } from './entities/insulina.entity';

@Injectable()
export class InsulinService {
  constructor(
    @InjectRepository(Insulina)
    private readonly insulinas: Repository<Insulina>,
  ) {}

  async create(
    userId: string,
    dto: CreateInsulinDto,
  ): Promise<InsulinResponseDto> {
    const salva = await this.insulinas.save(
      this.insulinas.create({
        ...dto,
        dataHora: new Date(dto.dataHora),
        user: { id: userId },
      }),
    );
    return toInsulinResponse(salva);
  }

  // Sempre filtrado pelo dono; mais recente primeiro.
  async findAll(
    userId: string,
    filtros: ListInsulinDto,
  ): Promise<InsulinResponseDto[]> {
    const where: FindOptionsWhere<Insulina> = { user: { id: userId } };
    const periodo = dateRangeWhere(filtros.startDate, filtros.endDate);
    if (periodo) where.dataHora = periodo;
    if (filtros.tipo) where.tipo = filtros.tipo;

    const lista = await this.insulinas.find({
      where,
      order: { dataHora: 'DESC' },
    });
    return lista.map(toInsulinResponse);
  }

  async findOne(userId: string, id: string): Promise<InsulinResponseDto> {
    return toInsulinResponse(await this.findOwned(userId, id));
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateInsulinDto,
  ): Promise<InsulinResponseDto> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Informe ao menos um campo para atualizar');
    }
    const insulina = await this.findOwned(userId, id);
    Object.assign(insulina, {
      ...dto,
      ...(dto.dataHora ? { dataHora: new Date(dto.dataHora) } : {}),
    });
    return toInsulinResponse(await this.insulinas.save(insulina));
  }

  // Exclusão física: o projeto não adota soft delete para registros.
  async remove(userId: string, id: string): Promise<void> {
    await this.insulinas.remove(await this.findOwned(userId, id));
  }

  // id + dono: registro de outro usuário é tratado como inexistente (404),
  // para não revelar que ele existe.
  private async findOwned(userId: string, id: string): Promise<Insulina> {
    const insulina = await this.insulinas.findOne({
      where: { id, user: { id: userId } },
    });
    if (!insulina) {
      throw new NotFoundException('Aplicação não encontrada');
    }
    return insulina;
  }
}
