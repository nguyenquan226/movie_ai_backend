import { PartialType } from '@nestjs/mapped-types';
import { CreateAllCodeDto } from './create-all-code.dto';

export class UpdateAllCodeDto extends PartialType(CreateAllCodeDto) {}
