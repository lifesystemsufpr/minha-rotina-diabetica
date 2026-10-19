import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { AuthService } from './auth.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import {
  FORGOT_PASSWORD_MESSAGE,
  PasswordResetService,
  RESET_PASSWORD_MESSAGE,
} from './password-reset.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastra um novo usuário e seu perfil inicial' })
  @ApiCreatedResponse({
    description: 'Usuário e perfil criados (nunca inclui senha/hash)',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Payload inválido ou com campos não permitidos; `details` lista os erros por campo',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'E-mail já cadastrado',
    type: ErrorResponseDto,
  })
  register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica e retorna o access token JWT' })
  @ApiOkResponse({
    description: 'Credenciais válidas: token JWT e dados mínimos do usuário',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido; `details` lista os erros por campo',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'E-mail ou senha inválidos (mensagem única, não revela se o e-mail existe)',
    type: ErrorResponseDto,
  })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita a recuperação de senha',
    description:
      'Se o e-mail existir, gera um token temporário (uso único, expira em ' +
      '`PASSWORD_RESET_TOKEN_TTL_MINUTES`, padrão 30) e o envia por e-mail. ' +
      'A resposta é SEMPRE a mesma, exista a conta ou não, para não revelar ' +
      'quais e-mails estão cadastrados.',
  })
  @ApiOkResponse({
    description: 'Resposta genérica (independe de a conta existir)',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'E-mail em formato inválido',
    type: ErrorResponseDto,
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.passwordReset.forgotPassword(dto.email);
    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Define uma nova senha usando o token de recuperação',
    description:
      'O token é de uso único. Token inexistente, expirado ou já usado ' +
      'retorna o mesmo 400 genérico.',
  })
  @ApiOkResponse({ description: 'Senha alterada', type: MessageResponseDto })
  @ApiBadRequestResponse({
    description:
      'Payload inválido (`details` por campo) ou token inválido/expirado/já usado',
    type: ErrorResponseDto,
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.passwordReset.resetPassword(dto.token, dto.novaSenha);
    return { message: RESET_PASSWORD_MESSAGE };
  }
}
