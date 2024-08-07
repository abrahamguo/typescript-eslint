import { noFormat, RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/no-empty-interface';

const ruleTester = new RuleTester();

ruleTester.run('no-empty-interface', rule, {
  valid: [
    `
interface Foo {
  name: string;
}
    `,
    `
interface Foo {
  name: string;
}

interface Bar {
  age: number;
}

// valid because extending multiple interfaces can be used instead of a union type
interface Baz extends Foo, Bar {}
    `,
    {
      code: `
interface Foo {
  name: string;
}

interface Bar extends Foo {}
      `,
      options: [{ allowSingleExtends: true }],
    },
    {
      code: `
interface Foo {
  props: string;
}

interface Bar extends Foo {}

class Bar {}
      `,
      options: [{ allowSingleExtends: true }],
    },
  ],
  invalid: [
    {
      code: 'interface Foo {}',
      output: null,
      errors: [
        {
          messageId: 'noEmpty',
          line: 1,
          column: 11,
        },
      ],
    },
    {
      code: noFormat`interface Foo extends {}`,
      output: null,
      errors: [
        {
          messageId: 'noEmpty',
          line: 1,
          column: 11,
        },
      ],
    },
    {
      code: `
interface Foo {
  props: string;
}

interface Bar extends Foo {}

class Baz {}
      `,
      output: `
interface Foo {
  props: string;
}

type Bar = Foo

class Baz {}
      `,
      options: [{ allowSingleExtends: false }],
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 6,
          column: 11,
        },
      ],
    },
    {
      code: `
interface Foo {
  props: string;
}

interface Bar extends Foo {}

class Bar {}
      `,
      options: [{ allowSingleExtends: false }],
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 6,
          column: 11,
        },
      ],
      output: null,
    },
    {
      code: `
interface Foo {
  props: string;
}

interface Bar extends Foo {}

const bar = class Bar {};
      `,
      output: `
interface Foo {
  props: string;
}

type Bar = Foo

const bar = class Bar {};
      `,
      options: [{ allowSingleExtends: false }],
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 6,
          column: 11,
        },
      ],
    },
    {
      code: `
interface Foo {
  name: string;
}

interface Bar extends Foo {}
      `,
      output: `
interface Foo {
  name: string;
}

type Bar = Foo
      `,
      options: [{ allowSingleExtends: false }],
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 6,
          column: 11,
        },
      ],
    },
    {
      code: 'interface Foo extends Array<number> {}',
      output: `type Foo = Array<number>`,
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 1,
          column: 11,
        },
      ],
    },
    {
      code: 'interface Foo extends Array<number | {}> {}',
      output: `type Foo = Array<number | {}>`,
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 1,
          column: 11,
        },
      ],
    },
    {
      code: `
interface Bar {
  bar: string;
}
interface Foo extends Array<Bar> {}
      `,
      output: `
interface Bar {
  bar: string;
}
type Foo = Array<Bar>
      `,
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 5,
          column: 11,
        },
      ],
    },
    {
      code: `
type R = Record<string, unknown>;
interface Foo extends R {}
      `,
      output: `
type R = Record<string, unknown>;
type Foo = R
      `,
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 3,
          column: 11,
        },
      ],
    },
    {
      code: `
interface Foo<T> extends Bar<T> {}
      `,
      output: `
type Foo<T> = Bar<T>
      `,
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 2,
          column: 11,
        },
      ],
    },
    {
      filename: 'test.d.ts',
      code: `
declare module FooBar {
  type Baz = typeof baz;
  export interface Bar extends Baz {}
}
      `,
      errors: [
        {
          messageId: 'noEmptyWithSuper',
          line: 4,
          column: 20,
          endLine: 4,
          endColumn: 23,
          suggestions: [
            {
              messageId: 'noEmptyWithSuper',
              output: `
declare module FooBar {
  type Baz = typeof baz;
  export type Bar = Baz
}
      `,
            },
          ],
        },
      ],
      // output matches input because a suggestion was made
      output: null,
    },
  ],
});
