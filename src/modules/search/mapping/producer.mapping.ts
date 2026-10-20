import { vietnameseAnalysisSettings, vietnameseTextField } from './vietnamese-analysis';

export const producerIndexMapping = {
  settings: vietnameseAnalysisSettings,
  mappings: {
    properties: {
      producerId: { type: 'keyword' as const },
      producerName: vietnameseTextField,
      slug: { type: 'text' as const, index: false },
    },
  },
};
