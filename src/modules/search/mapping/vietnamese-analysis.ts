export const vietnameseAnalysisSettings = {
  analysis: {
    filter: {
      edge_ngram_filter: {
        type: 'edge_ngram' as const,
        min_gram: 2,
        max_gram: 15,
      },
    },
    analyzer: {
      vn_analyzer: {
        type: 'custom' as const,
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding'],
      },
      vn_autocomplete: {
        type: 'custom' as const,
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding', 'edge_ngram_filter'],
      },
    },
  },
};

export const vietnameseTextField = {
  type: 'text' as const,
  analyzer: 'vn_analyzer',
  fields: {
    autocomplete: {
      type: 'text' as const,
      analyzer: 'vn_autocomplete',
      search_analyzer: 'vn_analyzer',
    },
  },
};
