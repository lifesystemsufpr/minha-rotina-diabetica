import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';

export const BCRYPT_ROUNDS = 10;
// Hash descartável: faz o login gastar o mesmo tempo com e-mail inexistente
const DUMMY_HASH = bcrypt.hashSync('senha-descartavel', BCRYPT_ROUNDS);

export const INVALID_CREDENTIALS = 'E-mail ou senha inválidos';
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const senhaHash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);
    return this.users.create({
      nome: dto.nome,
      email: dto.email,
      senhaHash,
      perfil: {
        dataNascimento: dto.dataNascimento,
        tipoDiabetes: dto.tipoDiabetes,
        alturaCm: dto.alturaCm,
        pesoKg: dto.pesoKg,
        contatoEmergencia: dto.contatoEmergencia,
      },
    });
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const ok = await bcrypt.compare(dto.senha, user?.senhaHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException(INVALID_CREDENTIALS);

    return {
      accessToken: this.signAccessToken(String(user.id)),
      user: { id: user.id, nome: user.nome, email: user.email },
    };
  }

  signAccessToken(userId: string): string {
    const payload: JwtPayload = { sub: userId }; // sem senha/hash/dados sensíveis
    return this.jwt.sign(payload);
  }
}
