export const filmIndexMapping = {
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
      filmId: { type: 'keyword' as const },
      // SEARCHABLE FIELDS
      title: { type: 'text' as const, analyzer: 'vn_analyzer' },
      originalTitle: { type: 'text' as const, analyzer: 'vn_analyzer' },

      // OPTIONAL (không search, chỉ lưu để trả UI)
      thumbUrl: { type: 'text' as const, index: false },
      slug: { type: 'keyword' as const },
      year: { type: 'keyword' as const },
      description: { type: 'text' as const, index: false }, // không search
    },
  },
};
