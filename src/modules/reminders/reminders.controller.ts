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
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { UpdateReminderStatusDto } from './dto/update-reminder-status.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { RemindersService } from './reminders.service';

@ApiTags('reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Token ausente, inválido, expirado ou de conta excluída',
  type: ErrorResponseDto,
})
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um lembrete (status inicia como ATIVO)' })
  @ApiCreatedResponse({ type: ReminderResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser('id') usuarioId: string,
    @Body() createReminderDto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.create(createReminderDto, usuarioId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os lembretes do usuário, ordenados por data/horário',
  })
  @ApiOkResponse({ type: [ReminderResponseDto] })
  findAll(
    @CurrentUser('id') usuarioId: string,
  ): Promise<ReminderResponseDto[]> {
    return this.remindersService.findAll(usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna um lembrete do usuário' })
  @ApiOkResponse({ type: ReminderResponseDto })
  @ApiNotFoundResponse({
    description: 'Não encontrado (ou de outro usuário)',
    type: ErrorResponseDto,
  })
  findOne(
    @CurrentUser('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.findOne(id, usuarioId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita título e/ou horário do lembrete' })
  @ApiOkResponse({ type: ReminderResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou nenhum campo enviado',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Não encontrado (ou de outro usuário)',
    type: ErrorResponseDto,
  })
  update(
    @CurrentUser('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.update(id, usuarioId, updateReminderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Altera o status do lembrete (ATIVO/INATIVO)' })
  @ApiOkResponse({ type: ReminderResponseDto })
  @ApiBadRequestResponse({
    description: 'Status inválido',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Não encontrado (ou de outro usuário)',
    type: ErrorResponseDto,
  })
  updateStatus(
    @CurrentUser('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReminderStatusDto: UpdateReminderStatusDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.updateStatus(
      id,
      usuarioId,
      updateReminderStatusDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui o lembrete' })
  @ApiNoContentResponse({ description: 'Lembrete excluído' })
  @ApiNotFoundResponse({
    description: 'Não encontrado (ou de outro usuário)',
    type: ErrorResponseDto,
  })
  remove(
    @CurrentUser('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.remindersService.remove(id, usuarioId);
  }
}
