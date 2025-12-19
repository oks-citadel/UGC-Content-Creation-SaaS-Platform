// =============================================================================
// OpenAI Mock Implementation
// =============================================================================

import { vi } from 'vitest';

export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        id: 'chatcmpl-mock123',
        object: 'chat.completion',
        created: Date.now() / 1000,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a mocked AI response for testing purposes.',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }),
    },
  },
  embeddings: {
    create: vi.fn().mockResolvedValue({
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: Array(1536).fill(0.1),
          index: 0,
        },
      ],
      model: 'text-embedding-ada-002',
      usage: {
        prompt_tokens: 8,
        total_tokens: 8,
      },
    }),
  },
  images: {
    generate: vi.fn().mockResolvedValue({
      created: Date.now() / 1000,
      data: [
        {
          url: 'https://example.com/generated-image.png',
        },
      ],
    }),
    edit: vi.fn().mockResolvedValue({
      created: Date.now() / 1000,
      data: [
        {
          url: 'https://example.com/edited-image.png',
        },
      ],
    }),
  },
  moderations: {
    create: vi.fn().mockResolvedValue({
      id: 'modr-mock123',
      model: 'text-moderation-stable',
      results: [
        {
          flagged: false,
          categories: {
            sexual: false,
            hate: false,
            violence: false,
            'self-harm': false,
            'sexual/minors': false,
            'hate/threatening': false,
            'violence/graphic': false,
          },
          category_scores: {
            sexual: 0.01,
            hate: 0.01,
            violence: 0.01,
            'self-harm': 0.01,
            'sexual/minors': 0.01,
            'hate/threatening': 0.01,
            'violence/graphic': 0.01,
          },
        },
      ],
    }),
  },
};

// Mock responses for different scenarios
export const mockOpenAIResponses = {
  contentAnalysis: {
    id: 'chatcmpl-analysis123',
    choices: [
      {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            sentiment: 'positive',
            topics: ['product review', 'lifestyle', 'technology'],
            quality_score: 8.5,
            recommendations: [
              'Add more engaging hooks',
              'Include call-to-action',
            ],
          }),
        },
        finish_reason: 'stop',
      },
    ],
  },
  hashtagSuggestions: {
    id: 'chatcmpl-hashtags123',
    choices: [
      {
        message: {
          role: 'assistant',
          content: JSON.stringify({
            hashtags: [
              '#UGC',
              '#ContentCreation',
              '#InfluencerMarketing',
              '#SocialMedia',
              '#BrandCollaboration',
            ],
          }),
        },
        finish_reason: 'stop',
      },
    ],
  },
  contentModeration: {
    id: 'modr-safe123',
    results: [
      {
        flagged: false,
        categories: Object.fromEntries(
          [
            'sexual',
            'hate',
            'violence',
            'self-harm',
            'sexual/minors',
            'hate/threatening',
            'violence/graphic',
          ].map((cat) => [cat, false])
        ),
      },
    ],
  },
  contentModerationFlagged: {
    id: 'modr-flagged123',
    results: [
      {
        flagged: true,
        categories: {
          sexual: false,
          hate: true,
          violence: false,
          'self-harm': false,
          'sexual/minors': false,
          'hate/threatening': false,
          'violence/graphic': false,
        },
      },
    ],
  },
};

// Factory function
export function createOpenAIMock(scenario?: keyof typeof mockOpenAIResponses) {
  if (scenario && mockOpenAIResponses[scenario]) {
    const response = mockOpenAIResponses[scenario];

    return {
      ...mockOpenAI,
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue(response),
        },
      },
    };
  }

  return mockOpenAI;
}

// Reset all mocks
export function resetOpenAIMocks() {
  Object.values(mockOpenAI).forEach((service) => {
    if (typeof service === 'object') {
      Object.values(service).forEach((method) => {
        if (typeof method === 'function' && 'mockClear' in method) {
          method.mockClear();
        }
      });
    }
  });
}

export default mockOpenAI;
