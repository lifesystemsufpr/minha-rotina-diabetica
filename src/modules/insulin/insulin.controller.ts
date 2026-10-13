import { Body, Controller, Post, Req, UseGuards, Query, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; 
import { CreateInsulinDto } from './dto/create-insulin.dto';
import { InsulinService } from './insulin.service';
import { ListInsulinDto } from './dto/list-insulin.dto';

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
    
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar as aplicações de insulina do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de aplicações (pode ser vazia)' })
  @ApiResponse({ status: 400, description: 'Filtro inválido' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })

  findAll(@Req() req: { user: { id: string } }, @Query() filtros: ListInsulinDto){
    return this.service.findAll(req.user.id, filtros);
  }
}

