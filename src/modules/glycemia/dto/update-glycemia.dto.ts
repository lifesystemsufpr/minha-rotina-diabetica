
import { PartialType } from '@nestjs/swagger';
import { CreateGlycemiaDto } from './create-glycemia.dto';

export class UpdateGlycemiaDto extends PartialType(CreateGlycemiaDto){}
