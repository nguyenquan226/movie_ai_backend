export const directorIndexMapping = {
  settings: {
    analysis: {
      analyzer: {
        vn_analyzer: {
          type: 'custom' as const,
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding'], // hỗ trợ tìm kiếm không dấu
        },
      },
    },
  },
  mappings: {
    properties: {
      directorId: { type: 'keyword' as const },
      // SEARCHABLE FIELDS
      directorName: { type: 'text' as const, analyzer: 'vn_analyzer' },

      avatarUrl: { type: 'text' as const, index: false },
      slug: { type: 'text' as const, index: false },
    },
  },
};
