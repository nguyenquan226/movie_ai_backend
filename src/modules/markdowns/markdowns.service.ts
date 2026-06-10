import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateMarkdownDto } from './dto/create-markdown.dto';
import { UpdateMarkdownDto } from './dto/update-markdown.dto';
import { IUser } from '../users/interface/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Markdown } from './entities/markdown.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MarkdownsService {
  constructor(
    @InjectRepository(Markdown)
    private markdownPlanRepository: Repository<Markdown>,
  ) {}
  async create(createMarkdownDto: CreateMarkdownDto, user: IUser) {}

  findAll() {
    return `This action returns all markdowns`;
  }

  findOne(id: number) {
    return `This action returns a #${id} markdown`;
  }

  update(id: number, updateMarkdownDto: UpdateMarkdownDto) {
    return `This action updates a #${id} markdown`;
  }

  remove(id: number) {
    return `This action removes a #${id} markdown`;
  }
}
