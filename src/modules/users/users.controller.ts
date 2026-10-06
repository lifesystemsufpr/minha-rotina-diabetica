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
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
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
  @ApiOkResponse({ description: 'Dados do usuário autenticado' })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou expirado',
    type: ErrorResponseDto,
  })
  async me(@CurrentUser('id') userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
