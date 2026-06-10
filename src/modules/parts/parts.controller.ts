import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  SerializeOptions,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { Public, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('parts')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues: true, enableImplicitConversion: true })
export class PartsController {
  constructor(private readonly partsService: PartsService) { }

  @Post()
  @Permission('Create a part', 'PARTS')
  create(@Body() createPartDto: CreatePartDto, @User() user: IUser) {
    return this.partsService.create(createPartDto, user);
  }

  @Public()
  @Post('film')
  @Permission('Get parts by film ID', 'PARTS')
  findAll(@Body() { filmId }: { filmId: string }) {
    return this.partsService.findAll(filmId);
  }

  @Public()
  @Post('admin/film')
  findAllAdmin(@Body() { filmId }: { filmId: string }) {
    return this.partsService.findAllAdmin(filmId);
  }

  @Public()
  @Get(':id')
  @Permission('Get part by ID', 'PARTS')
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @Patch(':id')
  @Permission('Update part by ID', 'PARTS')
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto, @User() user: IUser) {
    return this.partsService.update(id, updatePartDto, user);
  }

  @Delete(':id')
  @Permission('Delete part by ID', 'PARTS')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.partsService.remove(id, user);
  }
}
