import { Body, Controller, Post, Req, UseGuards, Query, Get, Param, Patch, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; 
import { CreateInsulinDto } from './dto/create-insulin.dto';
import { InsulinService } from './insulin.service';
import { ListInsulinDto } from './dto/list-insulin.dto';
import {UpdateInsulinDto } from './dto/update-insulin.dto';

@ApiTags('insulin-applications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('insulin-applications')

export class InsulinController {
  constructor(private readonly service: InsulinService) {}

  @Post() 
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
 

  //--------------------------------------------LISTAR-----------------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'Listar as aplicações de insulina do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de aplicações (pode ser vazia)' })
  @ApiResponse({ status: 400, description: 'Filtro inválido' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })

  findAll(@Req() req: { user: { id: string } }, @Query() filtros: ListInsulinDto){
    return this.service.findAll(req.user.id, filtros);
  }

//-----------------------------------------------------------------------------------------------------

  @Get(':id')
  @ApiOperation({ summary: 'Consultar aplicação por ID' })
  @ApiResponse({ status: 200, description: 'Aplicação encontrada' })
  @ApiResponse({ status: 401, description: 'Token inválido ou ausente' })
  @ApiResponse({ status: 404, description: 'Aplicação não encontrada' })
  findOne(@Req() req: { user: { id: string } }, 

  @Param('id') id: string){
    return this.service.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar aplicação por ID' })
  @ApiResponse({ status: 200, description: 'Aplicação atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token inválido ou ausente' })
  @ApiResponse({ status: 404, description: 'Aplicação não encontrada' })

  update(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateInsulinDto,
  ){
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir aplicação por ID' })
  @ApiResponse({ status: 200, description: 'Aplicação excluída' })
  @ApiResponse({ status: 401, description: 'Token inválido ou ausente' })
  @ApiResponse({ status: 404, description: 'Aplicação não encontrada' })
  remove(@Req() req: { user: { id: string } }, 

  @Param('id') id: string){
    return this.service.remove(req.user.id, id);
  }

}

