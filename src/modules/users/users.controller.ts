import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Post()
  @ApiCreatedResponse({ description: 'Payload válido' })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  create(@Body() dto: CreateUserDto) {
    // Se chegou até aqui, dto já passou pelo ValidationPipe global:
    // - todos os campos obrigatórios estão presentes e no formato certo
    // - não há propriedades extras além das definidas no DTO
    return {
      message: 'Usuário validado com sucesso',
      data: dto,
    };
  }
}
