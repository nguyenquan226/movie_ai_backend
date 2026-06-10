import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { User, Public, SkipCheckPermission } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post('create-rating')
  @Permission('Create rating', 'RATING')
  createRating(@Body() dto: CreateRatingDto, @User() user: IUser) {
    return this.ratingService.createRating(dto, user);
  }

  @Get('get-rating-by-film/:filmId')
  @Permission('Get ratings by film', 'RATING')
  @Public()
  getRatingsByFilm(@Param('filmId') filmId: string) {
    return this.ratingService.getRatingsByFilm(filmId);
  }

  @SkipCheckPermission()
  @Delete('delete-rating/:ratingId')
  @Permission('Delete rating', 'RATING')
  deleteRating(@Param('ratingId') ratingId: string, @User() user: IUser) {
    return this.ratingService.deleteRating(ratingId, user);
  }

  @Get('all-ratings')
  @Permission('Get all ratings for admin', 'RATING')
  getAllRatings(@Query() query: any) {
    return this.ratingService.getAllRatings(query);
  }

  @Get('statistics')
  @Permission('Get rating statistics', 'RATING')
  getStatistics() {
    return this.ratingService.getStatistics();
  }

  @Patch('admin-restore/:ratingId')
  @Permission('Restore rating', 'RATING')
  restoreRating(@Param('ratingId') ratingId: string, @User() user: IUser) {
    return this.ratingService.restoreRating(ratingId, user);
  }

  @Patch('hide/:ratingId')
  @Permission('Hide rating', 'RATING')
  hideRating(@Param('ratingId') ratingId: string, @User() user: IUser) {
    return this.ratingService.hideRating(ratingId, user.userId);
  }

  @Patch('unhide/:ratingId')
  @Permission('Unhide rating', 'RATING')
  unhideRating(@Param('ratingId') ratingId: string, @User() user: IUser) {
    return this.ratingService.unhideRating(ratingId, user.userId);
  }

  @Delete('hard-delete/:ratingId')
  @Permission('Hard delete rating', 'RATING')
  hardDeleteRating(@Param('ratingId') ratingId: string, @User() user: IUser) {
    return this.ratingService.hardDeleteRating(ratingId);
  }
}
