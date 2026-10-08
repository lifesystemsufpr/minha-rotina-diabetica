import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: '3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f' })
  id!: string;

  @ApiProperty({ example: 'Maria Silva' })
  nome!: string;

  @ApiProperty({ example: 'maria@example.com' })
  email!: string;

  @ApiProperty({ example: '2026-10-03T12:00:00.000Z' })
  createdAt!: Date;
}

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    createdAt: user.createdAt,
  };
}
