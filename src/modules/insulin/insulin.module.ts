import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insulina } from './entities/insulina.entity';
import { InsulinService } from './insulin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Insulina])],
  exports: [TypeOrmModule],
  providers: [InsulinService]
})
export class InsulinModule {}
