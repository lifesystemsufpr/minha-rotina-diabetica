import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  @ApiCreatedResponse({ description: 'Usuário criado (sem senha/hash)' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica e retorna o access token JWT' })
  @ApiOkResponse({ description: 'Retorna { accessToken }' })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas',
    type: ErrorResponseDto,
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
