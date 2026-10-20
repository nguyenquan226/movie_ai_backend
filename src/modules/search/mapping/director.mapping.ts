import { vietnameseAnalysisSettings, vietnameseTextField } from './vietnamese-analysis';

export const directorIndexMapping = {
  settings: vietnameseAnalysisSettings,
  mappings: {
    properties: {
      directorId: { type: 'keyword' as const },
      directorName: vietnameseTextField,
      avatarUrl: { type: 'text' as const, index: false },
      slug: { type: 'text' as const, index: false },
    },
  },
};
