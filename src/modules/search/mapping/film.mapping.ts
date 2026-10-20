import { vietnameseAnalysisSettings, vietnameseTextField } from './vietnamese-analysis';

export const filmIndexMapping = {
  settings: vietnameseAnalysisSettings,
  mappings: {
    properties: {
      filmId: { type: 'keyword' as const },
      title: vietnameseTextField,
      originalTitle: vietnameseTextField,
      thumbUrl: { type: 'text' as const, index: false },
      slug: { type: 'keyword' as const },
      year: { type: 'keyword' as const },
      description: { type: 'text' as const, analyzer: 'vn_analyzer' },
    },
  },
};
