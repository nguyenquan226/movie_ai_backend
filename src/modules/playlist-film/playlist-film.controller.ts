import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlaylistFilmService } from './playlist-film.service';
import { CreatePlaylistFilmDto } from './dto/create-playlist-film.dto';
import { UpdatePlaylistFilmDto } from './dto/update-playlist-film.dto';
import { Permission } from 'src/decorators/permission.decorator';
import { ResponseMessage } from 'src/decorators/customize';

@Controller('playlist-film')
export class PlaylistFilmController {
  constructor(private readonly playlistFilmService: PlaylistFilmService) { }

  @Post()
  @Permission('Create playlist-film relation ', 'PLAYLIST_FILM')
  @ResponseMessage('Create a new playlist-film relationship')
  create(@Body() createPlaylistFilmDto: CreatePlaylistFilmDto) {
    return this.playlistFilmService.create(createPlaylistFilmDto);
  }

  @Get()
  @Permission('Get all playlist-film relations', 'PLAYLIST_FILM')
  @ResponseMessage('Fetch all playlist-film relations')
  findAll() {
    return this.playlistFilmService.findAll();
  }

  @Get(':id')
  @Permission('Get playlist-film relation by ID', 'PLAYLIST_FILM')
  @ResponseMessage('Fetch a playlist-film relation by id')
  findOne(@Param('id') id: string) {
    return this.playlistFilmService.findOne(+id);
  }

  @Patch(':id')
  @Permission('Update playlist-film relation by ID', 'PLAYLIST_FILM')
  @ResponseMessage('Update a playlist-film relation')
  update(@Param('id') id: string, @Body() updatePlaylistFilmDto: UpdatePlaylistFilmDto) {
    return this.playlistFilmService.update(+id, updatePlaylistFilmDto);
  }

  @Delete(':id')
  @Permission('Delete playlist-film relation by ID', 'PLAYLIST_FILM')
  @ResponseMessage('Delete a playlist-film relation')
  remove(@Param('id') id: string) {
    return this.playlistFilmService.remove(+id);
  }
}
