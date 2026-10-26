import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateGlycemiaDto } from './dto/create-glycemia.dto';
import { GlycemiaService } from './glycemia.service';
import { ListGlycemiaDto } from './dto/list-glycemia.dto';
import { UpdateGlycemiaDto } from './dto/update-glycemia.dto';

@ApiTags('glycemias')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('glycemias')
export class GlycemiaController {
  constructor(private readonly service: GlycemiaService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar uma medição de glicemia' })
  @ApiResponse({ status: 201, description: 'Medição criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateGlycemiaDto) {
    return this.service.create(req.user.id, dto);
  }
  //-------------------------------LISTAR------------------------------------------

  @Get()
  @ApiResponse({ status: 200, description: 'Lista de glicemias' })
  @ApiResponse({ status: 400, description: 'Filtro inválido' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  findAll(
    @Req() req: { user: { id: string } },
    @Query() filtros: ListGlycemiaDto,
  ) {
    return this.service.findAll(req.user.id, filtros);
  }

  //-----------------------------------------------------------------------------------

  @Get(':id')
  @ApiOperation({ summary: 'Consultar glicemia por ID' })
  @ApiResponse({ status: 200, description: 'Glicemia encontrada' })
  @ApiResponse({ status: 401, description: 'Token inválido ou ausente' })
  @ApiResponse({ status: 404, description: 'Glicemia não encontrada' })
  findOne(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.service.findOne(req.user.id, id);
  }

  //----------------------------------------------------------------------------------

  @Patch(':id')
  @ApiOperation({ summary: 'Editar glicemia por ID' })
  @ApiResponse({ status: 200, description: 'Glicemia atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token inválido ou ausente' })
  @ApiResponse({ status: 404, description: 'Glicemia não encontrada' })
  update(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateGlycemiaDto,
  ) {
    return this.service.update(req.user.id, id, dto);
  }

  //--------------------------------------------------------------------------------------

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir glicemia por ID' })
  @ApiResponse({ status: 204, description: 'Glicemia excluída' })
  @ApiResponse({ status: 401, description: 'Token inválido ou ausente' })
  @ApiResponse({ status: 404, description: 'Glicemia não encontrada' })
  remove(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
