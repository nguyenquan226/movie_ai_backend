import { vietnameseAnalysisSettings, vietnameseTextField } from './vietnamese-analysis';

export const actorIndexMapping = {
  settings: vietnameseAnalysisSettings,
  mappings: {
    properties: {
      actorId: { type: 'keyword' as const },
      actorName: vietnameseTextField,
      avatarUrl: { type: 'text' as const, index: false },
      slug: { type: 'text' as const, index: false },
    },
  },
};
