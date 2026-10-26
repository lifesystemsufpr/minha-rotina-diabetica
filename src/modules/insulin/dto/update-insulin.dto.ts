import { PartialType } from '@nestjs/swagger';
import { CreateInsulinDto } from './create-insulin.dto';

export class UpdateInsulinDto extends PartialType(CreateInsulinDto) {}
