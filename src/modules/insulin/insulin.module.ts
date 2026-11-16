import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsulinaTipoBackup } from './entities/insulina-tipo-backup.entity';
import { Insulina } from './entities/insulina.entity';
import { InsulinController } from './insulin.controller';
import { InsulinService } from './insulin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Insulina, InsulinaTipoBackup])],
  controllers: [InsulinController],
  providers: [InsulinService],
  exports: [InsulinService],
})
export class InsulinModule {}
