export const producerIndexMapping = {
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
      producerId: { type: 'keyword' as const },
      // SEARCHABLE FIELDS
      producerName: { type: 'text' as const, analyzer: 'vn_analyzer' },

      slug: { type: 'text' as const, index: false },
    },
  },
};
