import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGlycemiaDto } from './dto/create-glycemia.dto';
import { GlycemiaResponseDto } from './dto/glycemia-response.dto';
import { ListGlycemiaDto } from './dto/list-glycemia.dto';
import { UpdateGlycemiaDto } from './dto/update-glycemia.dto';
import { GlycemiaService } from './glycemia.service';

@ApiTags('glycemias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Token ausente, inválido, expirado ou de conta excluída',
  type: ErrorResponseDto,
})
@Controller('glycemias')
export class GlycemiaController {
  constructor(private readonly service: GlycemiaService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar uma medição de glicemia' })
  @ApiCreatedResponse({ type: GlycemiaResponseDto })
  @ApiBadRequestResponse({
    description: 'Valor, momento ou data inválidos',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGlycemiaDto,
  ): Promise<GlycemiaResponseDto> {
    return this.service.create(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar as glicemias do usuário (mais recente primeiro)',
  })
  @ApiOkResponse({ type: [GlycemiaResponseDto] })
  @ApiBadRequestResponse({
    description: 'Filtro inválido',
    type: ErrorResponseDto,
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() filtros: ListGlycemiaDto,
  ): Promise<GlycemiaResponseDto[]> {
    return this.service.findAll(userId, filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar glicemia por ID' })
  @ApiOkResponse({ type: GlycemiaResponseDto })
  @ApiNotFoundResponse({
    description: 'Não encontrada (ou de outro usuário)',
    type: ErrorResponseDto,
  })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GlycemiaResponseDto> {
    return this.service.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar glicemia por ID (o status é recalculado)',
  })
  @ApiOkResponse({ type: GlycemiaResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Não encontrada (ou de outro usuário)',
    type: ErrorResponseDto,
  })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGlycemiaDto,
  ): Promise<GlycemiaResponseDto> {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir glicemia por ID' })
  @ApiNoContentResponse({ description: 'Glicemia excluída' })
  @ApiNotFoundResponse({
    description: 'Não encontrada (ou de outro usuário)',
    type: ErrorResponseDto,
  })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.remove(userId, id);
  }
}
