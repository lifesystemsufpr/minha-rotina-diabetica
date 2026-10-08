import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Payload válido' })
  @ApiBadRequestResponse({
    description: 'Payload inválido; `details` lista os erros por campo',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateUserDto) {
    return {
      message: 'Usuário validado com sucesso',
      data: dto,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOkResponse({
    description: 'Dados do usuário autenticado',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou expirado',
    type: ErrorResponseDto,
  })
  async me(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    // Nunca devolver a entidade: só os campos públicos do UserResponseDto.
    return toUserResponse(user);
  }

  @Delete('me')
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiNoContentResponse({
    description:
      'Conta marcada como inativa (soft delete). Dados de glicemia, insulina, lembretes e perfil permanecem no banco, associados ao usuário inativo.',
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
