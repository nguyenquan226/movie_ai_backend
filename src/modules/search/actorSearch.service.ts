import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Actor } from '../actor/entities/actor.entity';
import { IactorIndex } from './interfaces/index.interface';

@Injectable()
export class ActorSearchService {
  private readonly actorIndex = 'actors';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  private mapActorToIndex(actor: any): IactorIndex {
    return {
      actorId: actor.actorId,
      actorName: actor.actorName,
      slug: actor.slug,
      avatarUrl: actor.avatarUrl,
    };
  }

  async indexActor(actor: Actor) {
    const doc = this.mapActorToIndex(actor);
    try {
      const result = await this.elasticsearchService.index({
        index: this.actorIndex,
        id: actor.actorId.toString(),
        document: doc,
        // refresh: 'wait_for',
      });

      return {
        EC: 1,
        EM: 'Indexed actor successfully',
        result,
      };
    } catch (error) {
      console.error('Index actor error:', error);
      return {
        EC: 0,
        EM: 'Failed to index actor',
      };
    }
  }

  async bulkIndexActors(actors: Actor[]) {
    try {
      const operations = actors.flatMap((actor) => [
        { index: { _index: this.actorIndex, _id: actor.actorId } },
        {
          actorId: actor.actorId,
          actorName: actor.actorName,
          slug: actor.slug,
          avatarUrl: actor.avatarUrl,
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

  async searchActors(keyword: string) {
    try {
      const isExactPhrase = keyword.trim().includes(' ');
      const cleaned = keyword.trim().toLowerCase();

      const query = isExactPhrase
        ? {
            bool: {
              should: [
                {
                  match_phrase_prefix: {
                    actorName: {
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
                    actorName: {
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
        index: this.actorIndex,
        query: query,
        size: 20,
      });

      const data = result.hits.hits.map((hit) => hit._source);
      return {
        EC: 1,
        EM: 'Search actor succeed',
        actors: data,
        total: data.length,
      };
    } catch (error) {
      console.error('Search actor error:', error);
      return {
        EC: 0,
        EM: 'Failed to search actor',
      };
    }
  }

  // *chung
  async deleteIndex(index: string) {
    try {
      const deleteResult = await this.elasticsearchService.indices.delete({
        index: index,
      });
      if (deleteResult.acknowledged === true) {
        return {
          EC: 1,
          EM: `Deleted ${index} index suceed`,
          ...deleteResult,
        };
      }

      if (deleteResult.acknowledged === false) {
        return {
          EC: 0,
          EM: `Deleted ${index} index failed`,
          ...deleteResult,
        };
      }
    } catch (error) {
      console.error(`Delete ${index} index error:`, error);
      return {
        EC: 0,
        EM: `Failed to delete ${index} index`,
      };
    }
  }

  // *chung
  async getAllDocument(index: string) {
    try {
      const result = await this.elasticsearchService.search({
        index: index,
        query: { match_all: {} },
        size: 1000,
      });

      const data = result.hits.hits.map((h) => h._source);

      return {
        EC: 0,
        EM: 'Get all data from elasticsearch suceed',
        data: data,
        total: data.length,
      };
    } catch (error) {
      console.error('Error from  getAllDocument:', error);
      return {
        EC: 0,
        EM: 'Error from  getAllDocument:',
      };
    }
  }

  // *chung
  async countDocuments(index: string) {
    try {
      const result = await this.elasticsearchService.count({
        index: index,
      });
      return {
        EC: 1,
        EM: `Count actors from ${index} Index`,
        ...result,
      };
    } catch (error) {
      console.error('Error from  countDocuments:', error);
      return {
        EC: 0,
        EM: 'Error from countDocuments:',
      };
    }
  }

  // *chung
  async updateDocument(id: string, doc: any, index: string) {
    try {
      const response = await this.elasticsearchService.update({
        index: index,
        id: id,
        doc,
        doc_as_upsert: true,
        refresh: 'wait_for',
      });
      const result = response.result;

      if (result === 'updated' || result === 'created') {
        return {
          EC: 1,
          EM: `Updated ${index} document successfully`,
          result,
        };
      }

      return {
        EC: 0,
        EM: `Update ${index} document failed: ${result}`,
        result,
      };
    } catch (error: any) {
      console.error(`Update ${index} document error:`, error);
      return {
        EC: 0,
        EM: `Failed to update ${index} document`,
        error: error.meta?.body ?? error,
      };
    }
  }

  // *chung
  async removeFromIndex(id: string, index: string) {
    try {
      const response = await this.elasticsearchService.delete({
        index: index,
        id: id,
      });

      if (response.result === 'deleted') {
        return {
          EC: 1,
          EM: `Deleted ${index} document successfully`,
          ...response,
        };
      }

      if (response.result === `not_found`) {
        return {
          EC: 0,
          EM: `Deleted ${index} document failed`,
          ...response,
        };
      }
    } catch (error) {
      console.error(`Delete ${index} document error:`, error);
      return {
        EC: 0,
        EM: `Failed to delete ${index} document`,
      };
    }
  }

  // *chung
  async clearDocumentInIndex(index: string) {
    try {
      const response = await this.elasticsearchService.deleteByQuery({
        index: index,
        body: {
          query: {
            match_all: {},
          },
        },
        refresh: true,
      });

      return {
        EC: 1,
        EM: `Deleted all documents from ${index} index`,
        deleted: response.deleted,
      };
    } catch (error) {
      console.error(`Clear all documents error:`, error);
      return {
        EC: 0,
        EM: `Failed to delete all documents from ${index} index`,
      };
    }
  }
}
