import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from 'src/modules/users/interface/user.interface';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permission('Create a user', 'USERS')
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('get-user-with-pagination')
  @Permission('Get users with pagination', 'USERS')
  @ResponseMessage('Fetch user with pagination')
  getUsersWithPagination(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.usersService.getUsersWithPagination(+currentPage, +limit, qs);
  }

  @Get()
  @Permission('Get all users', 'USERS')
  @ResponseMessage('get All Users')
  findAll() {
    return this.usersService.findAll();
  }

  @Public()
  @Get(':id')
  @Permission('Get a user by ID', 'USERS')
  @SkipCheckPermission()
  @ResponseMessage('Fetch user by id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch('update')
  @Permission('Update a user by ID', 'USERS')
  @ResponseMessage('Update a user')
  update(@Body() updateUserDto: UpdateUserDto, @User() user: IUser) {
    return this.usersService.update(updateUserDto, user);
  }
  @Patch('update-profile')
  @Permission('Update user profile', 'USERS')
  @SkipCheckPermission()
  @ResponseMessage('Update profle a user')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto, @User() user: IUser) {
    return this.usersService.updateProfile(updateProfileDto, user);
  }

  @Delete(':id')
  @Permission('Delete a user by ID', 'USERS')
  @ResponseMessage('Delete a user')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.remove(+id, user);
  }
}
