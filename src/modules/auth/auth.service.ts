import {
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const BCRYPT_ROUNDS = 10;
// Hash descartável: faz o login gastar o mesmo tempo com e-mail inexistente
const DUMMY_HASH = bcrypt.hashSync('senha-descartavel', BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const senhaHash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);
    return this.users.create({ nome: dto.nome, email: dto.email, senhaHash });
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const ok = await bcrypt.compare(dto.senha, user?.senhaHash ?? DUMMY_HASH);
    // Conta excluída (soft delete) recebe a mesma resposta genérica.
    if (!user || !ok || !user.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return { accessToken: this.signAccessToken(String(user.id)) };
  }

  signAccessToken(userId: string): string {
    const payload: JwtPayload = { sub: userId }; // sem senha/hash/dados sensíveis
    return this.jwt.sign(payload);
  }

  // Assinaturas para fluxos futuros (não implementar nesta sprint)
  /* eslint-disable @typescript-eslint/no-unused-vars */
  forgotPassword(_email: string): Promise<void> {
    throw new NotImplementedException();
  }

  resetPassword(_token: string, _novaSenha: string): Promise<void> {
    throw new NotImplementedException();
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
