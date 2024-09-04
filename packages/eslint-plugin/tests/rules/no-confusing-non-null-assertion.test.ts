/* eslint-disable eslint-comments/no-use */
// this rule enforces adding parens, which prettier will want to fix and break the tests
/* eslint "@typescript-eslint/internal/plugin-test-formatting": ["error", { formatWithPrettier: false }] */
/* eslint-enable eslint-comments/no-use */

import { RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/no-confusing-non-null-assertion';

const ruleTester = new RuleTester();

ruleTester.run('no-confusing-non-null-assertion', rule, {
  valid: [
    //
    'a == b!;',
    'a = b!;',
    'a !== b;',
    'a != b;',
    '(a + b!) == c;',
    '(a + b!) = c;',
    'console.log(!(x instanceof SyntaxError));',
  ],
  invalid: [
    {
      code: 'a! == b;',
      errors: [
        {
          messageId: 'confusing',
          data: {
            operation: 'equal test',
            operator: '==',
            similarTest: 'equal',
          },
          line: 1,
          column: 1,
          suggestions: [{ messageId: 'notNeeded', output: 'a  == b;' }],
        },
      ],
    },
    {
      code: 'a! === b;',
      errors: [
        {
          messageId: 'confusing',
          data: { operation: 'equal test', operator: '===' },
          line: 1,
          column: 1,
          suggestions: [{ messageId: 'notNeeded', output: 'a  === b;' }],
        },
      ],
    },
    {
      code: 'a + b! == c;',
      errors: [
        {
          messageId: 'confusing',
          data: { operation: 'equal test', operator: '==' },
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'wrapUpLeft',
              output: '(a + b!) == c;',
            },
          ],
        },
      ],
    },
    {
      code: '(obj = new new OuterObj().InnerObj).Name! == c;',
      errors: [
        {
          messageId: 'confusing',
          data: { operation: 'equal test', operator: '==' },
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'notNeeded',
              output: '(obj = new new OuterObj().InnerObj).Name  == c;',
            },
          ],
        },
      ],
    },
    {
      code: '(a==b)! ==c;',
      errors: [
        {
          messageId: 'confusing',
          data: { operation: 'equal test', operator: '==' },
          line: 1,
          column: 1,
          suggestions: [{ messageId: 'notNeeded', output: '(a==b)  ==c;' }],
        },
      ],
    },
    {
      code: 'a! = b;',
      errors: [
        {
          messageId: 'confusing',
          data: { operation: 'assignment left hand', operator: '=' },
          line: 1,
          column: 1,
          suggestions: [{ messageId: 'notNeeded', output: 'a  = b;' }],
        },
      ],
    },
    {
      code: '(obj = new new OuterObj().InnerObj).Name! = c;',
      errors: [
        {
          messageId: 'confusing',
          data: { operation: 'assignment left hand', operator: '=' },
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'notNeeded',
              output: '(obj = new new OuterObj().InnerObj).Name  = c;',
            },
          ],
        },
      ],
    },
    {
      code: '(a=b)! =c;',
      errors: [
        {
          messageId: 'confusing',
          data: { operation: 'assignment left hand', operator: '=' },
          line: 1,
          column: 1,
          suggestions: [{ messageId: 'notNeeded', output: '(a=b)  =c;' }],
        },
      ],
    },
    {
      code: 'console.log(a !instanceof b);',
      errors: [
        {
          messageId: 'confusing',
          suggestions: [
            { messageId: 'notNeeded', output: 'console.log(a  instanceof b);' },
          ],
        },
      ],
    },
    {
      code: 'console.log(a! instanceof b);',
      errors: [
        {
          messageId: 'confusing',
          suggestions: [
            { messageId: 'notNeeded', output: 'console.log(a  instanceof b);' },
          ],
        },
      ],
    },
    {
      code: 'console.log(a!instanceof b);',
      errors: [
        {
          messageId: 'confusing',
          suggestions: [
            { messageId: 'notNeeded', output: 'console.log(a instanceof b);' },
          ],
        },
      ],
    },
    {
      code: 'console.log(a !in b);',
      errors: [
        {
          messageId: 'confusing',
          data: { operator: 'in', operation: 'in', similarTest: 'in' },
          suggestions: [
            { messageId: 'notNeeded', output: 'console.log(a  in b);' },
          ],
        },
      ],
    },
  ],
});
