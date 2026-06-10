import { Controller, Post } from '@nestjs/common';
import { Public, SkipCheckPermission } from 'src/decorators/customize';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}
}
