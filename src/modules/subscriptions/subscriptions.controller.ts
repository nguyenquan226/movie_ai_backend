import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @Post()
  @Permission('Create a subscription', 'SUBSCRIPTIONS')
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  @Permission('Get all subscriptions', 'SUBSCRIPTIONS')
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get('/get-by-id')
  @Permission('Get a subscription by user ID', 'SUBSCRIPTIONS')
  @SkipCheckPermission()
  @ResponseMessage('fetch a subscription by userId')
  findOne(@User() user: IUser) {
    return this.subscriptionsService.findOne(user.userId);
  }

  @Patch(':id')
  @Permission('Update a subscription by ID', 'SUBSCRIPTIONS')
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  @Permission('Delete a subscription by ID', 'SUBSCRIPTIONS')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(+id);
  }
}
