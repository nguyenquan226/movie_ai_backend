import { Injectable, OnModuleInit } from '@nestjs/common';
import { filmIndexMapping } from './mapping/film.mapping';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { IfilmIndex } from './interfaces/film-index.interface';
import { Film } from '../films/entities/film.entity';
import { actorIndexMapping } from './mapping/actor.mapping';
import { directorIndexMapping } from './mapping/director.mapping';
import { producerIndexMapping } from './mapping/producer.mapping';

@Injectable()
export class FilmSearchService implements OnModuleInit {
  private readonly filmIndex = 'films';
  private readonly actorIndex = 'actors';
  private readonly directorIndex = 'directors';
  private readonly producerIndex = 'producers';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      console.log('initializing Elasticsearch...');
      // Tạo index khi khởi động ứng dụng nếu chưa có
      await this.createIndex();

      await this.createIndexClone(this.actorIndex, actorIndexMapping);
      await this.createIndexClone(this.directorIndex, directorIndexMapping);
      await this.createIndexClone(this.producerIndex, producerIndexMapping);

      console.log('Elasticsearch initialized successfully');
    } catch (error) {
      console.warn(
        'WARNING: Elasticsearch is not available. Search features will be disabled.',
        error.message,
      );
    }
  }

  async createIndex() {
    const filmsIndexExists = await this.elasticsearchService.indices.exists({
      index: this.filmIndex,
    });

    console.log('check films index was created: ', filmsIndexExists);

    if (!filmsIndexExists) {
      await this.elasticsearchService.indices.create({
        index: this.filmIndex,
        body: {
          settings: filmIndexMapping.settings,
          mappings: filmIndexMapping.mappings,
        },
      });

      console.log(`Created new Elasticsearch index: ${this.filmIndex} `);
    }
  }

  async createIndexClone(index: string, indexMapping: any) {
    const dataIndexExists = await this.elasticsearchService.indices.exists({
      index: index,
    });

    console.log(`check ${index} index was created: `, dataIndexExists);

    if (!dataIndexExists) {
      await this.elasticsearchService.indices.create({
        index: index,
        body: {
          settings: indexMapping.settings,
          mappings: indexMapping.mappings,
        },
      });

      console.log(`Created new Elasticsearch index: ${index} `);
    }
  }

  // Index 1 film vào Elasticsearch
  async indexFilm(film: Film) {
    const doc = this.mapFilmToIndex(film);
    try {
      const result = await this.elasticsearchService.index({
        index: this.filmIndex,
        id: film.filmId,
        document: doc,
        // refresh: 'wait_for',
      });

      return {
        EC: 1,
        EM: 'Indexed film successfully',
        result,
      };
    } catch (error) {
      console.error('Index film error:', error);
      return {
        EC: 0,
        EM: 'Failed to index film',
      };
    }
  }

  async bulkIndexFilms(films: any[]) {
    try {
      const operations = films.flatMap((film) => [
        { index: { _index: this.filmIndex, _id: film.filmId } },
        {
          filmId: film.filmId,
          title: film.title,
          originalTitle: film.originalTitle,
          isVip: film.isVip,
          thumbUrl: film.thumbUrl,
          slug: film.slug,
          year: film.year,
          description: film.description,
        },
      ]);
      const result = await this.elasticsearchService.bulk({
        refresh: true,
        operations,
      });

      if (result.errors) {
        return {
          EC: 2,
          EM: 'Bulk index completed with errors',
          errorDetails: result.items,
        };
      }

      return {
        EC: 1,
        EM: 'Bulk index completed successfully',
        ...result,
      };
    } catch (error) {
      return {
        EC: 0,
        EM: 'Failed to bulk index films',
      };
    }
  }

  async searchFilms(keyword: string) {
    try {
      const isExactPhrase = keyword.trim().includes(' ');
      const cleaned = keyword.trim().toLowerCase();

      const query = isExactPhrase
        ? {
            bool: {
              should: [
                // Tìm theo title
                {
                  match_phrase_prefix: {
                    title: {
                      query: cleaned,
                      boost: 10,
                    },
                  },
                },

                // Tìm theo originalTitle
                {
                  match_phrase_prefix: {
                    originalTitle: {
                      query: cleaned,
                      boost: 8,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          }
        : {
            // 1 từ → KHÔNG fuzzy, chỉ match token
            bool: {
              should: [
                {
                  match: {
                    title: {
                      query: cleaned,
                      boost: 5,
                    },
                  },
                },
                {
                  match: {
                    originalTitle: {
                      query: cleaned,
                      boost: 3,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          };
      const result = await this.elasticsearchService.search({
        index: this.filmIndex,
        query: query,
        size: 20,
      });

      const films = result.hits.hits.map((hit) => hit._source);
      return {
        EC: 1,
        EM: 'Search films succeed',
        films: films,
        total: films.length,
      };
    } catch (error) {
      console.error('Search film error:', error);
      return {
        EC: 0,
        EM: 'Failed to search films',
      };
    }
  }

  async deleteIndexFilm() {
    try {
      const deleteResult = await this.elasticsearchService.indices.delete({
        index: this.filmIndex,
      });
      if (deleteResult.acknowledged === true) {
        return {
          EC: 1,
          EM: 'Deleted film index suceed',
          ...deleteResult,
        };
      }

      if (deleteResult.acknowledged === false) {
        return {
          EC: 0,
          EM: 'Deleted film index failed',
          ...deleteResult,
        };
      }
    } catch (error) {
      console.error('Delete index error:', error);
      return {
        EC: 0,
        EM: 'Failed to delete film index',
      };
    }
  }

  async getAllFilmDocument() {
    try {
      const result = await this.elasticsearchService.search({
        index: this.filmIndex,
        query: { match_all: {} },
        size: 1000,
      });

      const films = result.hits.hits.map((h) => h._source);

      return {
        EC: 0,
        EM: 'Get all films from elasticsearch suceed',
        films: films,
        total: films.length,
      };
    } catch (error) {
      console.error('Error from  getAllFilmsFromIndex:', error);
      return {
        EC: 0,
        EM: 'Error from  getAllFilmsFromIndex:',
      };
    }
  }

  async countFilms() {
    try {
      const result = await this.elasticsearchService.count({
        index: this.filmIndex,
      });
      return {
        EC: 1,
        EM: 'Count films from Films Index',
        ...result,
      };
    } catch (error) {
      console.error('Error from  countFilms:', error);
      return {
        EC: 0,
        EM: 'Error from countFilms:',
      };
    }
  }

  async updateFilmDocument(film: Film) {
    try {
      const doc = this.mapFilmToIndex(film);

      const response = await this.elasticsearchService.update({
        index: this.filmIndex,
        id: film.filmId,
        doc,
        doc_as_upsert: true, // nếu chưa có ==> tự tạo
        refresh: 'wait_for',
      });
      // - "updated": cập nhật thành công
      // - "noop": không có thay đổi
      // - "created": document chưa có → ES tự tạo mới
      const result = response.result;

      if (result === 'updated' || result === 'created') {
        return {
          EC: 1,
          EM: 'Updated film document successfully',
          result,
        };
      }

      return {
        EC: 0,
        EM: `Update film document failed: ${result}`,
        result,
      };
    } catch (error: any) {
      console.error('Update film document error:', error);
      return {
        EC: 0,
        EM: 'Failed to update film document',
        error: error.meta?.body ?? error,
      };
    }
  }
  async removeFilmFromIndex(filmId: string) {
    try {
      const response = await this.elasticsearchService.delete({
        index: this.filmIndex,
        id: filmId,
      });

      if (response.result === 'deleted') {
        return {
          EC: 1,
          EM: 'Deleted film document successfully',
          ...response,
        };
      }

      if (response.result === 'not_found') {
        return {
          EC: 0,
          EM: 'Deleted film document failed',
          ...response,
        };
      }
    } catch (error) {
      console.error('Delete film document error:', error);
      return {
        EC: 0,
        EM: 'Failed to delete film document',
      };
    }
  }

  private mapFilmToIndex(film: any): IfilmIndex {
    return {
      filmId: film.filmId,
      title: film.title,
      isVip: film.isVip,
      originalTitle: film.originalTitle,
      thumbUrl: film.thumbUrl,
      slug: film.slug,
      year: film.year,
      description: film.description,
    };
  }

  async clearDocumentInFilmIndex() {
    try {
      const response = await this.elasticsearchService.deleteByQuery({
        index: this.filmIndex,
        body: {
          query: {
            match_all: {},
          },
        },
        refresh: true,
      });

      return {
        EC: 1,
        EM: 'Deleted all documents from film index',
        deleted: response.deleted,
      };
    } catch (error) {
      console.error('Clear all documents error:', error);
      return {
        EC: 0,
        EM: 'Failed to delete all documents from film index',
      };
    }
  }
}
