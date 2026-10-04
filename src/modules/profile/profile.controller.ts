import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface RequestWithUser extends Request {
  user: { id: string };
}

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Retorna os dados do perfil do usuário autenticado',
  })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  async getProfile(
    @Req() request: RequestWithUser,
  ): Promise<ProfileResponseDto> {
    const usuarioId = request.user.id;
    return this.profileService.getProfileData(usuarioId);
  }

  @Patch()
  @ApiOperation({
    summary:
      'Atualiza dados pessoais e contato de emergência do usuário autenticado',
  })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  async updateProfile(
    @Req() request: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const usuarioId = request.user.id;
    return this.profileService.update(usuarioId, updateProfileDto);
  }
}
