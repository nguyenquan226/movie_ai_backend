import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { IdirectorIndex } from './interfaces/index.interface';
import { Director } from '../directors/entities/director.entity';

@Injectable()
export class DirectorSearchService {
  private readonly directorIndex = 'directors';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  private mapDirectorToIndex(director: any): IdirectorIndex {
    return {
      directorId: director.directorId,
      directorName: director.directorName,
      slug: director.slug,
      avatarUrl: director.avatarUrl,
    };
  }

  async indexDirector(director: Director) {
    const doc = this.mapDirectorToIndex(director);
    try {
      const result = await this.elasticsearchService.index({
        index: this.directorIndex,
        id: director.directorId.toString(),
        document: doc,
        // refresh: 'wait_for',
      });

      return {
        EC: 1,
        EM: 'Indexed director successfully',
        result,
      };
    } catch (error) {
      console.error('Index director error:', error);
      return {
        EC: 0,
        EM: 'Failed to index director',
      };
    }
  }

  async bulkIndexDirectors(directors: Director[]) {
    try {
      const operations = directors.flatMap((director) => [
        { index: { _index: this.directorIndex, _id: director.directorId } },
        {
          directorId: director.directorId,
          directorName: director.directorName,
          slug: director.slug,
          avatarUrl: director.avatarUrl,
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
        EM: 'Failed to bulk index atcors',
      };
    }
  }

  async searchDirectors(keyword: string) {
    try {
      const isExactPhrase = keyword.trim().includes(' ');
      const cleaned = keyword.trim().toLowerCase();

      const query = isExactPhrase
        ? {
            bool: {
              should: [
                {
                  match_phrase_prefix: {
                    directorName: {
                      query: cleaned,
                      boost: 10,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          }
        : {
            bool: {
              should: [
                {
                  match: {
                    directorName: {
                      query: cleaned,
                      boost: 5,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          };
      const result = await this.elasticsearchService.search({
        index: this.directorIndex,
        query: query,
        size: 20,
      });

      const data = result.hits.hits.map((hit) => hit._source);
      return {
        EC: 1,
        EM: 'Search director succeed',
        directors: data,
        total: data.length,
      };
    } catch (error) {
      console.error('Search director error:', error);
      return {
        EC: 0,
        EM: 'Failed to search director',
      };
    }
  }
}
