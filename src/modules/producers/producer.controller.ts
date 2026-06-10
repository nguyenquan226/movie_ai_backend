import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { ProducerService } from './producer.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Public, ResponseMessage, User, SkipCheckPermission } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('producer')
export class ProducerController {
  constructor(private readonly producerService: ProducerService) {}

  @Post('create-producer')
  @Permission('Create a producer', 'PRODUCER')
  @SkipCheckPermission()
  @ResponseMessage('Create a new producer')
  async createProducer(@Body() dto: CreateProducerDto, @User() user: IUser) {
    return await this.producerService.createProducer(dto, user);
  }

  @SkipCheckPermission()
  @Public()
  @Get('all')
  async getAll() {
    return await this.producerService.getAll();
  }

  @Get('get-all-producers')
  @Permission('Get all producers', 'PRODUCER')
  @SkipCheckPermission()
  @Public()
  @ResponseMessage('Get all producers with pagination, filtering, and sorting')
  async getAllProducers(@Query() query: PaginationDto) {
    return await this.producerService.getAllProducers(query);
  }

  @Public()
  @Get('get-producer-by-id/:producerId')
  @Permission('Get producer by ID', 'PRODUCER')
  @ResponseMessage('Get producer by ID')
  async getProducerById(@Param('producerId', ParseIntPipe) producerId: number) {
    return await this.producerService.getProducerById(producerId);
  }

  @Patch('edit-producer/:producerId')
  @Permission('Update producer by ID', 'PRODUCER')
  @ResponseMessage('Edit producer by ID')
  @SkipCheckPermission()
  @ResponseMessage('Edit producer by ID')
  async updateProducer(
    @Param('producerId', ParseIntPipe) producerId: number,
    @Body() dto: UpdateProducerDto,
    @User() user: IUser,
  ) {
    return await this.producerService.updateProducer(producerId, dto, user);
  }

  @Delete('delete-producer-by-id/:producerId')
  @SkipCheckPermission()
  @Permission('Delete producer by ID', 'PRODUCER')
  @ResponseMessage('Delete producer by ID')
  async deleteProducerById(
    @Param('producerId', ParseIntPipe) producerId: number,
    @Query('newProducerId', new ParseIntPipe({ optional: true })) newProducerId?: number,
    @User() user?: IUser,
  ) {
    return await this.producerService.deleteProducerById(producerId, newProducerId, user);
  }
}
