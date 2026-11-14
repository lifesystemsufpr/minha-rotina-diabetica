import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';
import { PerfilIncompletoException } from '../../../common/exceptions';
import { AuthUser } from '../../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Perfil } from '../../users/entities/perfil.entity';
import { isPerfilCompleto } from '../../users/utils/perfil-completo';

// Bloqueia a rota enquanto o perfil não estiver completo (2ª etapa do
// cadastro). Usa o DataSource (global) para funcionar em qualquer módulo sem
// precisar importar o módulo de usuários.
@Injectable()
export class PerfilCompletoGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    // Sem usuário o JwtAuthGuard já teria barrado; aqui só por segurança.
    if (!user?.id) throw new PerfilIncompletoException();

    const perfil = await this.dataSource.getRepository(Perfil).findOne({
      where: { user: { id: user.id } },
    });
    if (!isPerfilCompleto(perfil)) throw new PerfilIncompletoException();
    return true;
  }
}

// Atalho para os controllers das funcionalidades: exige token válido E perfil
// completo, nessa ordem (sem token continua 401; sem perfil, 403).
export function ExigePerfilCompleto() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, PerfilCompletoGuard),
    ApiForbiddenResponse({
      description:
        'Perfil incompleto (code: PERFIL_INCOMPLETO). Complete em PATCH /profile.',
      type: ErrorResponseDto,
    }),
  );
}
