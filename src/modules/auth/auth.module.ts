import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';

// AuthService, controller e JWT entram na task de Auth.
@Module({
  imports: [UsersModule],
})
export class AuthModule {}
