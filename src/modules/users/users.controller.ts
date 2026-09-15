import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  @Post()
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