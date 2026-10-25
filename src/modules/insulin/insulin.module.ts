import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insulina } from './entities/insulina.entity';
import { InsulinController } from './insulin.controller';
import { InsulinService } from './insulin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Insulina])],
  controllers: [InsulinController],
  providers: [InsulinService],
  exports: [InsulinService],
})
export class InsulinModule {}
