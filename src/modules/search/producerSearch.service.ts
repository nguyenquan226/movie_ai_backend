import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { IproducerIndex } from './interfaces/index.interface';
import { Producer } from '../producers/entities/producer.entity';

@Injectable()
export class ProducerSearchService {
  private readonly producerIndex = 'producers';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  private mapProducerToIndex(producer: any): IproducerIndex {
    return {
      producerId: producer.producerId,
      producerName: producer.producerName,
      slug: producer.slug,
    };
  }

  async indexProducer(producer: Producer) {
    const doc = this.mapProducerToIndex(producer);
    try {
      const result = await this.elasticsearchService.index({
        index: this.producerIndex,
        id: producer.producerId.toString(),
        document: doc,
        // refresh: 'wait_for',
      });

      return {
        EC: 1,
        EM: 'Indexed producer successfully',
        result,
      };
    } catch (error) {
      console.error('Index producer error:', error);
      return {
        EC: 0,
        EM: 'Failed to index producer',
      };
    }
  }

  async bulkIndexProducers(producers: Producer[]) {
    try {
      const operations = producers.flatMap((producer) => [
        { index: { _index: this.producerIndex, _id: producer.producerId } },
        {
          producerId: producer.producerId,
          producerName: producer.producerName,
          slug: producer.slug,
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

  async searchProducers(keyword: string) {
    try {
      const isExactPhrase = keyword.trim().includes(' ');
      const cleaned = keyword.trim().toLowerCase();

      const query = isExactPhrase
        ? {
            bool: {
              should: [
                {
                  match_phrase_prefix: {
                    producerName: {
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
                    producerName: {
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
        index: this.producerIndex,
        query: query,
        size: 20,
      });

      const data = result.hits.hits.map((hit) => hit._source);
      return {
        EC: 1,
        EM: 'Search producer succeed',
        producers: data,
        total: data.length,
      };
    } catch (error) {
      console.error('Search producer error:', error);
      return {
        EC: 0,
        EM: 'Failed to search producer',
      };
    }
  }
}
