import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';

@ApiTags('reminders')
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}
}
