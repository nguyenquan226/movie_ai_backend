import { Controller, Post, Body, Get } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) { }

  @Post('toggle')
  @Permission('Toggle favorite film', 'FAVORITES')
  @SkipCheckPermission()
  toggle(@Body() dto: ToggleFavoriteDto, @User() user: IUser) {
    return this.favoritesService.toggleFavorite(user.userId, dto.filmId);
  }

  @Get('get-by-favid')
  @Permission('Get favorite by ID', 'FAVORITES')
  @SkipCheckPermission()
  @ResponseMessage('Add/Delete favorite film')
  getByid(@Body('favId') id: string) {
    return this.favoritesService.getAdocumentbyId(id);
  }

  @Get('get-user-favorite-list')
  @Permission('Get user favorite list', 'FAVORITES')
  @SkipCheckPermission()
  @ResponseMessage('get favorite films list for user')
  getFavoriteList(@User() user: IUser) {
    return this.favoritesService.getUserFavoriteFilmList(user.userId);
  }
}
