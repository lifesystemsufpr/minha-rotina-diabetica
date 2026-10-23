import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Token ausente, inválido, expirado ou de conta excluída',
  type: ErrorResponseDto,
})
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Retorna os dados do perfil do usuário autenticado',
  })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiNotFoundResponse({
    description: 'Perfil não encontrado',
    type: ErrorResponseDto,
  })
  getProfile(
    @CurrentUser('id') usuarioId: string,
  ): Promise<ProfileResponseDto> {
    return this.profileService.getProfileData(usuarioId);
  }

  @Patch()
  @ApiOperation({
    summary:
      'Atualiza dados pessoais e contato de emergência do usuário autenticado',
  })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Perfil não encontrado',
    type: ErrorResponseDto,
  })
  updateProfile(
    @CurrentUser('id') usuarioId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profileService.update(usuarioId, updateProfileDto);
  }
}
