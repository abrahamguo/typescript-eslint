import { RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/require-array-sort-compare';
import { getFixturesRootDir } from '../RuleTester';

const rootPath = getFixturesRootDir();

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: rootPath,
    },
  },
});

ruleTester.run('require-array-sort-compare', rule, {
  valid: [
    `
      function f(a: any[]) {
        a.sort(undefined);
      }
    `,
    `
      function f(a: any[]) {
        a.sort((a, b) => a - b);
      }
    `,
    `
      function f(a: Array<string>) {
        a.sort(undefined);
      }
    `,
    `
      function f(a: Array<number>) {
        a.sort((a, b) => a - b);
      }
    `,
    `
      function f(a: { sort(): void }) {
        a.sort();
      }
    `,
    `
      class A {
        sort(): void {}
      }
      function f(a: A) {
        a.sort();
      }
    `,
    `
      interface A {
        sort(): void;
      }
      function f(a: A) {
        a.sort();
      }
    `,
    `
      interface A {
        sort(): void;
      }
      function f<T extends A>(a: T) {
        a.sort();
      }
    `,
    `
      function f(a: any) {
        a.sort();
      }
    `,
    `
      namespace UserDefined {
        interface Array {
          sort(): void;
        }
        function f(a: Array) {
          a.sort();
        }
      }
    `,
    // optional chain
    `
      function f(a: any[]) {
        a?.sort((a, b) => a - b);
      }
    `,
    `
      namespace UserDefined {
        interface Array {
          sort(): void;
        }
        function f(a: Array) {
          a?.sort();
        }
      }
    `,
    {
      code: `
        ['foo', 'bar', 'baz'].sort();
      `,
      options: [{ ignoreStringArrays: true }],
    },
    {
      code: `
        function getString() {
          return 'foo';
        }
        [getString(), getString()].sort();
      `,
      options: [{ ignoreStringArrays: true }],
    },
    {
      code: `
        const foo = 'foo';
        const bar = 'bar';
        const baz = 'baz';
        [foo, bar, baz].sort();
      `,
      options: [{ ignoreStringArrays: true }],
    },
    {
      code: `
        declare const x: string[];
        x.sort();
      `,
      options: [{ ignoreStringArrays: true }],
    },
    {
      code: `
        function f(a: number[]) {
          a.toSorted((a, b) => a - b);
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        function f(a: Array<any>) {
          a.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        function f(a: number[]) {
          a.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        function f(a: number[]) {
          a.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
      options: [{ ignoreStringArrays: false }],
    },
    {
      code: `
        function f(a: number | number[]) {
          if (Array.isArray(a)) a.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        function f(a: string | string[]) {
          if (Array.isArray(a)) a.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
      options: [{ ignoreStringArrays: false }],
    },
    {
      code: `
        function f(a: number[] | string[]) {
          a.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        function f<T extends number[]>(a: T) {
          a.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        function f<T, U extends T[]>(a: U) {
          a.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    // optional chain
    {
      code: `
        function f(a: number[]) {
          a?.sort();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        [1, 2, 3].sort();
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        function getNumber() {
          return 1;
        }
        [getNumber(), getNumber()].sort();
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        const foo = 1;
        const bar = 2;
        const baz = 3;
        [foo, bar, baz].sort();
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
    {
      code: `
        [2, 'bar', 'baz'].sort();
      `,
      errors: [{ messageId: 'requireCompare' }],
      options: [{ ignoreStringArrays: true }],
    },
    {
      code: `
        function getNumber() {
          return 2;
        }
        [2, 3].sort();
      `,
      errors: [{ messageId: 'requireCompare' }],
      options: [{ ignoreStringArrays: true }],
    },
    {
      code: `
        const one = 1;
        const two = 2;
        const three = 3;
        [one, two, three].sort();
      `,
      errors: [{ messageId: 'requireCompare' }],
      options: [{ ignoreStringArrays: true }],
    },
    {
      code: `
        function f(a: number[]) {
          a.toSorted();
        }
      `,
      errors: [{ messageId: 'requireCompare' }],
    },
  ],
});
