import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthUser, JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  // Só roda depois que assinatura e expiração foram validadas. O token de uma
  // conta excluída (soft delete) ou inexistente deixa de ser aceito aqui.
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      !Number.isSafeInteger(payload.ver) ||
      payload.ver < 0
    ) {
      throw new UnauthorizedException();
    }
    const user = await this.users.findById(payload.sub);
    if (!user || !user.ativo || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException();
    }
    return { id: user.id };
  }
}
