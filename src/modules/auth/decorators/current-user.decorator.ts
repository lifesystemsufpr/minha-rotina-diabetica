import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUser } from '../interfaces/jwt-payload.interface';

// Devolve o usuário autenticado (ou um campo dele). Se não houver usuário na
// requisição (rota sem JwtAuthGuard por esquecimento), responde 401 em vez de
// devolver `undefined`: no TypeORM, `where: { user: { id: undefined } }` ignora
// o filtro e devolveria dados de TODOS os usuários.
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user?.id) throw new UnauthorizedException();
    return field ? user[field] : user;
  },
);