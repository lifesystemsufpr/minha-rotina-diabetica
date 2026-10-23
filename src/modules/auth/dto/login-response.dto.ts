import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: '3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f' })
  id!: string;

  @ApiProperty({ example: 'Maria Silva' })
  nome!: string;

  @ApiProperty({ example: 'maria@example.com' })
  email!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT para o header `Authorization: Bearer <accessToken>`',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({ type: LoginUserDto })
  user!: LoginUserDto;
}
