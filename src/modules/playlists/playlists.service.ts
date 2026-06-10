import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { Repository } from 'typeorm';
import { PlaylistFilm } from '../playlist-film/entities/playlist-film.entity';
import { Film } from '../films/entities/film.entity';
import { AddFilmToPlaylistDto } from './dto/add-film-to-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private playlistRepo: Repository<Playlist>,

    @InjectRepository(PlaylistFilm)
    private playlistFilmRepo: Repository<PlaylistFilm>,

    @InjectRepository(Film)
    private filmRepo: Repository<Film>,
  ) {}

  async createPlaylist(userId: number, createDto: CreatePlaylistDto) {
    try {
      const isExist = await this.playlistRepo.exists({
        where: { playlistName: createDto.playlistName, userId: userId },
      });

      if (isExist) {
        return {
          EC: 2,
          EM: `Playlist ${createDto.playlistName} has already exist`,
        };
      }
      const newPlaylist = this.playlistRepo.create({
        userId: userId,
        playlistName: createDto.playlistName,
        description: createDto.description,
      });

      await this.playlistRepo.save(newPlaylist);

      return {
        EC: 1,
        EM: 'Create playlist successfully',
      };
    } catch (error) {
      console.log('check error create Playlist', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'check error create Playlist',
      });
    }
  }

  async getUserAllPlaylists(userId: number) {
    try {
      const playlists = await this.playlistRepo.find({
        where: { userId: userId },
        relations: ['playlistFilms', 'playlistFilms.film'],
        order: {
          createdAt: 'DESC',
        },
      });

      if (playlists) {
        const mapped = playlists.map((p) => {
          const listFilmId = p.playlistFilms.map((item) => {
            return item.filmId;
          });
          return {
            playlistId: p.playlistId,
            playlistName: p.playlistName,
            description: p.description,
            total_film: p.playlistFilms.length,
            films: listFilmId,
          };
        });
        return {
          EC: 1,
          EM: 'Get all playlists successfully',
          playlists: mapped,
        };
      }
    } catch (error) {
      console.log('check error getUserAllPlaylists', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getUserAllPlaylists',
      });
    }
  }

  async getPlaylistDetail(playlistId: string) {
    try {
      const playlist = await this.playlistRepo.findOne({
        where: { playlistId: playlistId },
        relations: ['playlistFilms', 'playlistFilms.film'],
      });

      if (!playlist)
        return {
          EC: 0,
          EM: 'Playlist not found',
        };

      const mapped = playlist.playlistFilms.map((pf) => {
        return {
          filmId: pf.film.filmId,
          originalTitle: pf.film.originalTitle,
          title: pf.film.title,
          thumbUrl: pf.film.thumbUrl,
          slug: pf.film.slug,
        };
      });

      const dataReturn = {
        playlistId: playlist.playlistId,
        name: playlist.playlistName,
        description: playlist.description,
        films: mapped,
        total_film: mapped.length,
      };
      return {
        EC: 1,
        EM: 'Get playlist detail successfully',
        ...dataReturn,
      };
    } catch (error) {
      console.log('check error getPlaylistDetail', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getPlaylistDetail',
      });
    }
  }

  async addFilmToPlaylist(userId: number, dto: AddFilmToPlaylistDto) {
    try {
      const playlist = await this.playlistRepo.findOne({
        where: { playlistId: dto.playlistId, userId: userId },
      });

      if (!playlist) {
        return {
          EC: 0,
          EM: 'Playlist not found',
        };
      }

      const film = await this.filmRepo.findOne({ where: { filmId: dto.filmId } });
      if (!film) {
        return {
          EC: 0,
          EM: 'Film not found',
        };
      }

      const newPF = this.playlistFilmRepo.create({
        playlistId: dto.playlistId,
        filmId: dto.filmId,
      });

      const res = await this.playlistFilmRepo.save(newPF);

      //check xem nếu có sẵn film trong playlist thì làm thế nào
      return {
        EC: 1,
        EM: 'Add film successfully',
      };
    } catch (error) {
      console.log('check error addFilmToPlaylist', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from addFilmToPlaylist',
      });
    }
  }

  async removeFilmFromPlaylist(playlistId: string, filmId: string) {
    try {
      const result = await this.playlistFilmRepo.delete({ playlistId: playlistId, filmId: filmId });

      if (result && result.affected === 1) {
        return { EC: 1, EM: 'Remove film successfully' };
      } else {
        return { EC: 0, EM: 'Remove film failed' };
      }
    } catch (error) {
      console.log('check error removeFilmFromPlaylist', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from removeFilmFromPlaylist',
      });
    }
  }

  async deletePlaylist(userId: number, playlistId: string) {
    try {
      const playlist = await this.playlistRepo.findOne({
        where: { userId: userId, playlistId: playlistId },
        relations: ['playlistFilms'],
      });
      if (!playlist) {
        return {
          EC: 0,
          EM: 'Playlist not found',
        };
      }
      await this.playlistRepo.remove(playlist);
      return {
        EC: 1,
        EM: 'Delete playlist successfully',
      };
    } catch (error) {
      console.log('Error delete playlist', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deletePlaylist',
      });
    }
  }

  async editPlaylist(userId: number, playlistId: string, dto: UpdatePlaylistDto) {
    try {
      const playlist = await this.playlistRepo.findOne({
        where: { userId: userId, playlistId: playlistId },
      });

      if (!playlist) {
        return {
          EC: 0,
          EM: 'Playlist not found',
        };
      }

      if (dto.playlistName && dto.playlistName !== playlist.playlistName) {
        const isExist = await this.playlistRepo.exists({
          where: {
            userId: userId,
            playlistName: dto.playlistName,
          },
        });

        if (isExist) {
          return {
            EC: 2,
            EM: `Playlist ${dto.playlistName} already exists`,
          };
        }
      }

      playlist.playlistName = dto.playlistName ?? playlist.playlistName;
      playlist.description = dto.description ?? playlist.description;

      await this.playlistRepo.save(playlist);

      return {
        EC: 1,
        EM: 'Update playlist successfully',
      };
    } catch (error) {
      console.log('Error update playlist', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from editPlaylist',
      });
    }
  }
}
