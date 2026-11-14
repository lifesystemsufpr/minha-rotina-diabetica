import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lembrete } from './entities/lembrete.entity';
import { StatusLembrete } from './enums/status-lembrete.enum';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { UpdateReminderStatusDto } from './dto/update-reminder-status.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Lembrete)
    private readonly lembreteRepository: Repository<Lembrete>,
  ) {}

  async create(
    createReminderDto: CreateReminderDto,
    usuarioId: string,
  ): Promise<ReminderResponseDto> {
    const lembrete = this.lembreteRepository.create({
      titulo: createReminderDto.titulo,
      dataHora: new Date(createReminderDto.dataHora),
      status: StatusLembrete.ATIVO,
      user: { id: usuarioId },
    });

    const salvo = await this.lembreteRepository.save(lembrete);
    return this.toResponseDto(salvo);
  }

  async findAll(usuarioId: string): Promise<ReminderResponseDto[]> {
    const lembretes = await this.lembreteRepository.find({
      where: { user: { id: usuarioId } },
      order: { dataHora: 'ASC' },
    });

    return lembretes.map((lembrete) => this.toResponseDto(lembrete));
  }

  async findOne(id: string, usuarioId: string): Promise<ReminderResponseDto> {
    const lembrete = await this.findOwnedOrFail(id, usuarioId);
    return this.toResponseDto(lembrete);
  }

  async update(
    id: string,
    usuarioId: string,
    updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    if (Object.keys(updateReminderDto).length === 0) {
      throw new BadRequestException('Informe ao menos um campo para atualizar');
    }
    const lembrete = await this.findOwnedOrFail(id, usuarioId);

    if (updateReminderDto.titulo !== undefined) {
      lembrete.titulo = updateReminderDto.titulo;
    }
    if (updateReminderDto.dataHora !== undefined) {
      lembrete.dataHora = new Date(updateReminderDto.dataHora);
    }

    const salvo = await this.lembreteRepository.save(lembrete);
    return this.toResponseDto(salvo);
  }

  async updateStatus(
    id: string,
    usuarioId: string,
    updateReminderStatusDto: UpdateReminderStatusDto,
  ): Promise<ReminderResponseDto> {
    const lembrete = await this.findOwnedOrFail(id, usuarioId);
    lembrete.status = updateReminderStatusDto.status;

    const salvo = await this.lembreteRepository.save(lembrete);
    return this.toResponseDto(salvo);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const lembrete = await this.findOwnedOrFail(id, usuarioId);
    await this.lembreteRepository.remove(lembrete);
  }

  private async findOwnedOrFail(
    id: string,
    usuarioId: string,
  ): Promise<Lembrete> {
    const lembrete = await this.lembreteRepository.findOne({
      where: { id, user: { id: usuarioId } },
    });

    if (!lembrete) {
      throw new NotFoundException('Lembrete não encontrado.');
    }

    return lembrete;
  }

  private toResponseDto(lembrete: Lembrete): ReminderResponseDto {
    return {
      id: lembrete.id,
      titulo: lembrete.titulo,
      dataHora: lembrete.dataHora,
      status: lembrete.status,
    };
  }
}
