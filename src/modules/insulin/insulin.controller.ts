import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; // ajuste ao caminho do seu Guard
import { CreateInsulinDto } from './dto/create-insulin.dto';
import { InsulinService } from './insulin.service';

@ApiTags('insulin-applications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('insulin-applications')
export class InsulinController {
  constructor(private readonly service: InsulinService) {}

  @Post() // POST já responde 201 por padrão
  @ApiOperation({ summary: 'Registrar uma aplicação de insulina' })
  @ApiResponse({ status: 201, description: 'Aplicação criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos (ex.: dose <= 0)' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateInsulinDto,
  ) {
    // o usuário vem do token, nunca do body
    return this.service.create(req.user.id, dto);
  }
}