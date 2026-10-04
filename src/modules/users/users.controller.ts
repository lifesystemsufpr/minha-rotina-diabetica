import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: string };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Delete('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiNoContentResponse({ description: 'Conta marcada como inativa (soft delete). Dados de glicemia, insulina, lembretes e perfil permanecem no banco, associados ao usuário inativo.',
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiConflictResponse({ description: 'Conta já está inativa' })
  async deleteAccount(@Req() request: RequestWithUser): Promise<void> {
    const usuarioId = request.user.id;
    await this.usersService.deleteAccount(usuarioId);
  }
}