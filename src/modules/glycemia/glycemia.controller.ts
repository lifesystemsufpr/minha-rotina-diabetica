import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateGlycemiaDto } from './dto/create-glycemia.dto';
import { GlycemiaService } from './glycemia.service';

@ApiTags('glycemias')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('glycemias')

export class GlycemiaController{
  constructor(private readonly service: GlycemiaService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar uma medição de glicemia' })
  @ApiResponse({ status: 201, description: 'Medição criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })

  create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateGlycemiaDto){
    return this.service.create(req.user.id, dto);
  }
}
