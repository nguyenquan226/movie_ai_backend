import { PartialType } from '@nestjs/mapped-types';
import { CreateMarkdownDto } from './create-markdown.dto';

export class UpdateMarkdownDto extends PartialType(CreateMarkdownDto) {}
