import {
  Controller,
  Body,
  Delete,
  Get,
  HttpCode,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto';
import { AceitarTermosDto } from './dto/aceitar-termos.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Retorna o usuário autenticado e seu perfil',
    description:
      'O usuário é identificado SOMENTE pelo token (nunca por parâmetro). Nunca inclui senha/hash.',
  })
  @ApiOkResponse({
    description: 'Dados do usuário autenticado (com perfil)',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou expirado',
    type: ErrorResponseDto,
  })
  async me(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    const user = await this.users.findByIdWithPerfil(userId);
    // Token válido de usuário que não existe mais
    if (!user) throw new UnauthorizedException();
    return toUserResponse(user);
  }

  @Post('me/termos')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Aceitar a versão vigente dos termos',
    description:
      'Disponível também para contas com perfil incompleto. O primeiro aceite da versão mantém sua data.',
  })
  @ApiOkResponse({
    description: 'Dados atualizados do usuário autenticado',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Versão dos termos ausente ou inválida',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido, expirado ou de conta excluída',
    type: ErrorResponseDto,
  })
  async aceitarTermos(
    @CurrentUser('id') userId: string,
    @Body() dto: AceitarTermosDto,
  ): Promise<UserResponseDto> {
    return this.users.aceitarTermos(userId, dto.versaoTermos);
  }

  @Delete('me')
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Excluir a própria conta',
    description:
      'Exclui a conta do usuário autenticado (LGPD). Liberada mesmo com o perfil incompleto. Depois disso, o token deixa de valer (401). Detalhes em docs/account-deletion.md.',
  })
  @ApiNoContentResponse({
    description:
      'Conta excluída: perfil, glicemias, aplicações de insulina, lembretes e tokens de recuperação são apagados, e a linha do usuário é anonimizada e desativada, na mesma transação.',
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiConflictResponse({ description: 'Conta já está inativa' })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido, expirado ou de conta excluída',
    type: ErrorResponseDto,
  })
  async deleteAccount(@CurrentUser('id') usuarioId: string): Promise<void> {
    await this.users.deleteAccount(usuarioId);
  }
}
