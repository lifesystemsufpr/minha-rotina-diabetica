import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto';
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
}
