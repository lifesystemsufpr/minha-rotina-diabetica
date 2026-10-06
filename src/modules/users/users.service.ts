import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const user = await this.userRepository.findOne({
      where: { id: usuarioId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!user.ativo) {
      throw new ConflictException('Esta conta já está inativa.');
    }

    user.ativo = false;
    await this.userRepository.save(user);
  }
}
