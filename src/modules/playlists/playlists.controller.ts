import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistFilmService } from '../playlist-film/playlist-film.service';
import { Public, SkipCheckPermission, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import type { IUser } from '../users/interface/user.interface';
import { AddFilmToPlaylistDto } from './dto/add-film-to-playlist.dto';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) { }

  @Post()
  @Permission('Create playlist', 'PLAYLISTS')
  @SkipCheckPermission()
  createPlaylist(@User() user: IUser, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.createPlaylist(user.userId, dto);
  }

  @Get('all-playlist')
  @Permission('Get user all playlists', 'PLAYLISTS')
  @SkipCheckPermission()
  getUserPlaylists(@User() user: IUser) {
    return this.playlistsService.getUserAllPlaylists(user.userId);
  }

  @Get(':id')
  @Permission('Get playlist detail by ID', 'PLAYLISTS')
  @SkipCheckPermission()
  getPlaylistDetail(@Param('id') playlistId: string) {
    return this.playlistsService.getPlaylistDetail(playlistId);
  }

  @Post('add-film')
  @Permission('Add film to playlist', 'PLAYLISTS')
  @SkipCheckPermission()
  addFilm(@User() user: IUser, @Body() dto: AddFilmToPlaylistDto) {
    return this.playlistsService.addFilmToPlaylist(user.userId, dto);
  }

  @Delete(':id/film/:filmId')
  @Permission('Remove film from playlist', 'PLAYLISTS')
  @SkipCheckPermission()
  removeFilm(@Param('id') playlistId: string, @Param('filmId') filmId: string) {
    return this.playlistsService.removeFilmFromPlaylist(playlistId, filmId);
  }

  @Delete('remove-playlist/:playlistId')
  @Permission('Delete playlist by ID', 'PLAYLISTS')
  @SkipCheckPermission()
  DeletePlaylist(@User() user: IUser, @Param('playlistId') playlistId: string) {
    return this.playlistsService.deletePlaylist(user.userId, playlistId);
  }

  @Patch('edit-playlist/:playlistId')
  @Permission('Edit playlist by ID', 'PLAYLISTS')
  @SkipCheckPermission()
  EditPlaylist(
    @User() user: IUser,
    @Param('playlistId') playlistId: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.editPlaylist(user.userId, playlistId, dto);
  }
}
