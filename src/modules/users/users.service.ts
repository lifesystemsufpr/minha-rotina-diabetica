import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async deleteAccount(usuarioId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: usuarioId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // TODO: decisão pendente do time (soft vs hard delete)
    //
    // OPÇÃO A — Soft delete (requer adicionar coluna `ativo` ou `deletedAt` na entidade User):
    // user.ativo = false;
    // await this.userRepository.save(user);
    //
    // OPÇÃO B — Hard delete:
    // await this.userRepository.remove(user);
    //
    // Por enquanto, nenhuma das duas está ativa — aguardando resposta do time.
    throw new Error('Estratégia de exclusão ainda não definida pelo time.');
  }
}