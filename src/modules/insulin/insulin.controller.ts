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
import { CreateInsulinDto } from './dto/create-insulin.dto';
import { InsulinResponseDto } from './dto/insulin-response.dto';
import { ListInsulinDto } from './dto/list-insulin.dto';
import { UpdateInsulinDto } from './dto/update-insulin.dto';
import { InsulinService } from './insulin.service';

@ApiTags('insulin-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Token ausente, inválido, expirado ou de conta excluída',
  type: ErrorResponseDto,
})
@Controller('insulin-applications')
export class InsulinController {
  constructor(private readonly service: InsulinService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar uma aplicação de insulina' })
  @ApiCreatedResponse({ type: InsulinResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados inválidos (ex.: dose <= 0)',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInsulinDto,
  ): Promise<InsulinResponseDto> {
    return this.service.create(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar as aplicações do usuário (mais recente primeiro)',
  })
  @ApiOkResponse({ type: [InsulinResponseDto] })
  @ApiBadRequestResponse({
    description: 'Filtro inválido',
    type: ErrorResponseDto,
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() filtros: ListInsulinDto,
  ): Promise<InsulinResponseDto[]> {
    return this.service.findAll(userId, filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar aplicação por ID' })
  @ApiOkResponse({ type: InsulinResponseDto })
  @ApiNotFoundResponse({
    description: 'Não encontrada (ou de outro usuário)',
    type: ErrorResponseDto,
  })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InsulinResponseDto> {
    return this.service.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar aplicação por ID' })
  @ApiOkResponse({ type: InsulinResponseDto })
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
    @Body() dto: UpdateInsulinDto,
  ): Promise<InsulinResponseDto> {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir aplicação por ID' })
  @ApiNoContentResponse({ description: 'Aplicação excluída' })
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
