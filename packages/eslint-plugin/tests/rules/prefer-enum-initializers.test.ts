import { RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/prefer-enum-initializers';

const ruleTester = new RuleTester();

ruleTester.run('prefer-enum-initializers', rule, {
  valid: [
    `
enum Direction {}
    `,
    `
enum Direction {
  Up = 1,
}
    `,
    `
enum Direction {
  Up = 1,
  Down = 2,
}
    `,
    `
enum Direction {
  Up = 'Up',
  Down = 'Down',
}
    `,
  ],
  // We need to keep indentation for avoiding @typescript-eslint/internal/plugin-test-formatting.
  // Use trimRight() to make tests pass for now. https://github.com/typescript-eslint/typescript-eslint/pull/2326#discussion_r461760044
  invalid: [
    {
      code: `
enum Direction {
  Up,
}
      `,
      errors: [
        {
          data: { name: 'Up' },
          line: 3,
          messageId: 'defineInitializer',
          suggestions: [
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 0,
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 1,
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 'Up',
}
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
enum Direction {
  Up,
  Down,
}
      `,
      errors: [
        {
          data: { name: 'Up' },
          line: 3,
          messageId: 'defineInitializer',
          suggestions: [
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 0,
  Down,
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 1,
  Down,
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 'Up',
  Down,
}
      `,
            },
          ],
        },
        {
          data: { name: 'Down' },
          line: 4,
          messageId: 'defineInitializer',
          suggestions: [
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up,
  Down = 1,
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up,
  Down = 2,
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up,
  Down = 'Down',
}
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
enum Direction {
  Up = 'Up',
  Down,
}
      `,
      errors: [
        {
          data: { name: 'Down' },
          line: 4,
          messageId: 'defineInitializer',
          suggestions: [
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 'Up',
  Down = 1,
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 'Up',
  Down = 2,
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 'Up',
  Down = 'Down',
}
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
enum Direction {
  Up,
  Down = 'Down',
}
      `,
      errors: [
        {
          data: { name: 'Up' },
          line: 3,
          messageId: 'defineInitializer',
          suggestions: [
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 0,
  Down = 'Down',
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 1,
  Down = 'Down',
}
      `,
            },
            {
              messageId: 'defineInitializerSuggestion',
              output: `
enum Direction {
  Up = 'Up',
  Down = 'Down',
}
      `,
            },
          ],
        },
      ],
    },
  ],
});
