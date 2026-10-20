import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lembrete } from './entities/lembrete.entity';
import { StatusLembrete } from './enums/status-lembrete.enum';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Lembrete)
    private readonly elmbreteRepository: Repository<Lembrete>,
  ) {}

  async create(
    createReminderDto: CreateReminderDto,
    usuarioId: string,
  ): Promise<Lembrete> {
    const lembrete = this.elmbreteRepository.create({
      titulo: createReminderDto.titulo,
      dataHora: new Date(createReminderDto.dataHora),
      status: StatusLembrete.ATIVO,
      user: { id: usuarioId },
    });
    return await this.elmbreteRepository.save(lembrete);
  }
}
