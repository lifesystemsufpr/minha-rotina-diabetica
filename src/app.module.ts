import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './database/database.module';
import { GlycemiaModule} from './modules/glycemia/glycemia.module';
import { InsulinModule } from './modules/insulin/insulin.module';
import { RemindersModule } from './modules/reminders/remiders.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, }), UsersModule, DatabaseModule, GlycemiaModule, InsulinModule, RemindersModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
