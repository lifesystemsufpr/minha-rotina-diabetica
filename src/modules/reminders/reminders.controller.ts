import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { UpdateReminderStatusDto } from './dto/update-reminder-status.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: string };
}

@ApiTags('reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um lembrete (status inicia como ATIVO)' })
  @ApiResponse({ status: 201, type: ReminderResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Req() request: RequestWithUser,
    @Body() createReminderDto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.create(createReminderDto, request.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os lembretes do usuário, ordenados por data/horário',
  })
  @ApiResponse({ status: 200, type: [ReminderResponseDto] })
  findAll(@Req() request: RequestWithUser): Promise<ReminderResponseDto[]> {
    return this.remindersService.findAll(request.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna um lembrete do usuário' })
  @ApiResponse({ status: 200, type: ReminderResponseDto })
  @ApiNotFoundResponse({ description: 'Lembrete não encontrado' })
  findOne(
    @Req() request: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.findOne(id, request.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita título e/ou horário do lembrete' })
  @ApiResponse({ status: 200, type: ReminderResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiNotFoundResponse({ description: 'Lembrete não encontrado' })
  update(
    @Req() request: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.update(id, request.user.id, updateReminderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Altera o status do lembrete (ATIVO/INATIVO)' })
  @ApiResponse({ status: 200, type: ReminderResponseDto })
  @ApiResponse({ status: 400, description: 'Status inválido' })
  @ApiNotFoundResponse({ description: 'Lembrete não encontrado' })
  updateStatus(
    @Req() request: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReminderStatusDto: UpdateReminderStatusDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.updateStatus(
      id,
      request.user.id,
      updateReminderStatusDto,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui o lembrete' })
  @ApiNoContentResponse({ description: 'Lembrete excluído' })
  @ApiNotFoundResponse({ description: 'Lembrete não encontrado' })
  async remove(
    @Req() request: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.remindersService.remove(id, request.user.id);
  }
}
