import type { InvalidTestCase } from '@typescript-eslint/rule-tester';

import { RuleTester } from '@typescript-eslint/rule-tester';

import type { MessageIds, Options } from '../../src/rules/unbound-method';

import rule from '../../src/rules/unbound-method';
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

function addContainsMethodsClass(code: string): string {
  return `
class ContainsMethods {
  bound?: () => void;
  unbound?(): void;

  static boundStatic?: () => void;
  static unboundStatic?(): void;
}

let instance = new ContainsMethods();

const arith = {
  double(this: void, x: number): number {
    return x * 2;
  }
};

${code}
  `;
}
function addContainsMethodsClassInvalid(
  code: string[],
): InvalidTestCase<MessageIds, Options>[] {
  return code.map(c => ({
    code: addContainsMethodsClass(c),
    errors: [
      {
        line: 18,
        messageId: 'unboundWithoutThisAnnotation',
      },
    ],
  }));
}

ruleTester.run('unbound-method', rule, {
  valid: [
    'Promise.resolve().then(console.log);',
    "['1', '2', '3'].map(Number.parseInt);",
    '[5.2, 7.1, 3.6].map(Math.floor);',
    `
      const foo = Number;
      ['1', '2', '3'].map(foo.parseInt);
    `,
    `
      const foo = Math;
      [5.2, 7.1, 3.6].map(foo.floor);
    `,
    "['1', '2', '3'].map(Number['floor']);",
    'const x = console.log;',
    'const x = Object.defineProperty;',
    `
      const foo = Object;
      const x = foo.defineProperty;
    `,
    'const x = String.fromCharCode;',
    `
      const foo = String;
      const x = foo.fromCharCode;
    `,
    'const x = RegExp.prototype;',
    'const x = Symbol.keyFor;',
    `
      const foo = Symbol;
      const x = foo.keyFor;
    `,
    'const x = Array.isArray;',
    `
      const foo = Array;
      const x = foo.isArray;
    `,
    `
      class Foo extends Array {}
      const x = Foo.isArray;
    `,
    'const x = Proxy.revocable;',
    `
      const foo = Proxy;
      const x = foo.revocable;
    `,
    'const x = Date.parse;',
    `
      const foo = Date;
      const x = foo.parse;
    `,
    'const x = Atomics.load;',
    `
      const foo = Atomics;
      const x = foo.load;
    `,
    'const x = Reflect.deleteProperty;',
    'const x = JSON.stringify;',
    `
      const foo = JSON;
      const x = foo.stringify;
    `,
    `
      const o = {
        f: function (this: void) {},
      };
      const f = o.f;
    `,
    `
      const { alert } = window;
    `,
    `
      let b = window.blur;
    `,
    `
      function foo() {}
      const fooObject = { foo };
      const { foo: bar } = fooObject;
    `,
    ...[
      'instance.bound();',
      'instance.unbound();',

      'ContainsMethods.boundStatic();',
      'ContainsMethods.unboundStatic();',

      'const bound = instance.bound;',
      'const boundStatic = ContainsMethods;',

      'const { bound } = instance;',
      'const { boundStatic } = ContainsMethods;',

      '(instance.bound)();',
      '(instance.unbound)();',

      '(ContainsMethods.boundStatic)();',
      '(ContainsMethods.unboundStatic)();',

      'instance.bound``;',
      'instance.unbound``;',

      'if (instance.bound) { }',
      'if (instance.unbound) { }',

      'if (instance.bound !== undefined) { }',
      'if (instance.unbound !== undefined) { }',

      'if (ContainsMethods.boundStatic) { }',
      'if (ContainsMethods.unboundStatic) { }',

      'if (ContainsMethods.boundStatic !== undefined) { }',
      'if (ContainsMethods.unboundStatic !== undefined) { }',

      'if (ContainsMethods.boundStatic && instance) { }',
      'if (ContainsMethods.unboundStatic && instance) { }',

      'if (instance.bound || instance) { }',
      'if (instance.unbound || instance) { }',

      'ContainsMethods.unboundStatic && 0 || ContainsMethods;',

      '(instance.bound || instance) ? 1 : 0',
      '(instance.unbound || instance) ? 1 : 0',

      'while (instance.bound) { }',
      'while (instance.unbound) { }',

      'while (instance.bound !== undefined) { }',
      'while (instance.unbound !== undefined) { }',

      'while (ContainsMethods.boundStatic) { }',
      'while (ContainsMethods.unboundStatic) { }',

      'while (ContainsMethods.boundStatic !== undefined) { }',
      'while (ContainsMethods.unboundStatic !== undefined) { }',

      'instance.bound as any;',
      'ContainsMethods.boundStatic as any;',

      'instance.bound++;',
      '+instance.bound;',
      '++instance.bound;',
      'instance.bound--;',
      '-instance.bound;',
      '--instance.bound;',
      'instance.bound += 1;',
      'instance.bound -= 1;',
      'instance.bound *= 1;',
      'instance.bound /= 1;',

      'instance.bound || 0;',
      'instance.bound && 0;',

      'instance.bound ? 1 : 0;',
      'instance.unbound ? 1 : 0;',

      'ContainsMethods.boundStatic++;',
      '+ContainsMethods.boundStatic;',
      '++ContainsMethods.boundStatic;',
      'ContainsMethods.boundStatic--;',
      '-ContainsMethods.boundStatic;',
      '--ContainsMethods.boundStatic;',
      'ContainsMethods.boundStatic += 1;',
      'ContainsMethods.boundStatic -= 1;',
      'ContainsMethods.boundStatic *= 1;',
      'ContainsMethods.boundStatic /= 1;',

      'ContainsMethods.boundStatic || 0;',
      'instane.boundStatic && 0;',

      'ContainsMethods.boundStatic ? 1 : 0;',
      'ContainsMethods.unboundStatic ? 1 : 0;',

      "typeof instance.bound === 'function';",
      "typeof instance.unbound === 'function';",

      "typeof ContainsMethods.boundStatic === 'function';",
      "typeof ContainsMethods.unboundStatic === 'function';",

      'instance.unbound = () => {};',
      'instance.unbound = instance.unbound.bind(instance);',
      'if (!!instance.unbound) {}',
      'void instance.unbound',
      'delete instance.unbound',

      'const { double } = arith;',
    ].map(addContainsMethodsClass),
    `
interface RecordA {
  readonly type: 'A';
  readonly a: {};
}
interface RecordB {
  readonly type: 'B';
  readonly b: {};
}
type AnyRecord = RecordA | RecordB;

function test(obj: AnyRecord) {
  switch (obj.type) {
  }
}
    `,
    // https://github.com/typescript-eslint/typescript-eslint/issues/496
    `
class CommunicationError {
  constructor() {
    const x = CommunicationError.prototype;
  }
}
    `,
    `
class CommunicationError {}
const x = CommunicationError.prototype;
    `,
    // optional chain
    `
class ContainsMethods {
  bound?: () => void;
  unbound?(): void;

  static boundStatic?: () => void;
  static unboundStatic?(): void;
}

function foo(instance: ContainsMethods | null) {
  instance?.bound();
  instance?.unbound();

  if (instance?.bound) {
  }
  if (instance?.unbound) {
  }

  typeof instance?.bound === 'function';
  typeof instance?.unbound === 'function';
}
    `,
    // https://github.com/typescript-eslint/typescript-eslint/issues/1425
    `
interface OptionalMethod {
  mightBeDefined?(): void;
}

const x: OptionalMethod = {};
declare const myCondition: boolean;
if (myCondition || x.mightBeDefined) {
  console.log('hello world');
}
    `,
    // https://github.com/typescript-eslint/typescript-eslint/issues/1256
    `
class A {
  unbound(): void {
    this.unbound = undefined;
    this.unbound = this.unbound.bind(this);
  }
}
    `,
    'const { parseInt } = Number;',
    'const { log } = console;',
    `
let parseInt;
({ parseInt } = Number);
    `,
    `
let log;
({ log } = console);
    `,
    `
const foo = {
  bar: 'bar',
};
const { bar } = foo;
    `,
    `
class Foo {
  unbnound() {}
  bar = 4;
}
const { bar } = new Foo();
    `,
    `
class Foo {
  bound = () => 'foo';
}
const { bound } = new Foo();
    `,
    `
class Foo {
  bound = () => 'foo';
}
function foo({ bound } = new Foo()) {}
    `,
    `
class Foo {
  bound = () => 'foo';
}
declare const bar: Foo;
function foo({ bound }: Foo) {}
    `,
    `
class Foo {
  bound = () => 'foo';
}
class Bar {
  bound = () => 'bar';
}
function foo({ bound }: Foo | Bar) {}
    `,
    `
class Foo {
  bound = () => 'foo';
}
type foo = ({ bound }: Foo) => void;
    `,
    `
class Foo {
  unbound = function () {};
}
type foo = ({ unbound }: Foo) => void;
    `,
    `
class Foo {
  bound = () => 'foo';
}
class Bar {
  bound = () => 'bar';
}
function foo({ bound }: Foo & Bar) {}
    `,
    `
class Foo {
  unbound = function () {};
}
declare const { unbound }: Foo;
    `,
    "declare const { unbound } = '***';",
    `
class Foo {
  unbound = function () {};
}
type foo = (a: (b: (c: ({ unbound }: Foo) => void) => void) => void) => void;
    `,
    `
class Foo {
  unbound = function () {};
}
class Bar {
  property: ({ unbound }: Foo) => void;
}
    `,
    `
class Foo {
  unbound = function () {};
}
function foo<T extends ({ unbound }: Foo) => void>() {}
    `,
    `
class Foo {
  unbound = function () {};
}
abstract class Bar {
  abstract foo({ unbound }: Foo);
}
    `,
    `
class Foo {
  unbound = function () {};
}
declare class Bar {
  foo({ unbound }: Foo);
}
    `,
    `
class Foo {
  unbound = function () {};
}
declare function foo({ unbound }: Foo);
    `,
    `
class Foo {
  unbound = function () {};
}
interface Bar {
  foo: ({ unbound }: Foo) => void;
}
    `,
    `
class Foo {
  unbound = function () {};
}
interface Bar {
  foo({ unbound }: Foo): void;
}
    `,
    `
class Foo {
  unbound = function () {};
}
interface Bar {
  new ({ unbound }: Foo): Foo;
}
    `,
    `
class Foo {
  unbound = function () {};
}
type foo = new ({ unbound }: Foo) => void;
    `,
    'const { unbound } = { unbound: () => {} };',
    'function foo({ unbound }: { unbound: () => void } = { unbound: () => {} }) {}',
    // https://github.com/typescript-eslint/typescript-eslint/issues/1866
    `
class BaseClass {
  x: number = 42;
  logThis() {}
}
class OtherClass extends BaseClass {
  superLogThis: any;
  constructor() {
    super();
    this.superLogThis = super.logThis;
  }
}
const oc = new OtherClass();
oc.superLogThis();
    `,
  ],
  invalid: [
    {
      code: `
class Console {
  log(str) {
    process.stdout.write(str);
  }
}

const console = new Console();

Promise.resolve().then(console.log);
      `,
      errors: [
        {
          line: 10,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
import { console } from './class';
const x = console.log;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: addContainsMethodsClass(`
function foo(arg: ContainsMethods | null) {
  const unbound = arg?.unbound;
  arg.unbound += 1;
  arg?.unbound as any;
}
      `),
      errors: [
        {
          line: 20,
          messageId: 'unboundWithoutThisAnnotation',
        },
        {
          line: 21,
          messageId: 'unboundWithoutThisAnnotation',
        },
        {
          line: 22,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    ...addContainsMethodsClassInvalid([
      'const unbound = instance.unbound;',
      'const unboundStatic = ContainsMethods.unboundStatic;',

      'const { unbound } = instance;',
      'const { unboundStatic } = ContainsMethods;',

      '<any>instance.unbound;',
      'instance.unbound as any;',

      '<any>ContainsMethods.unboundStatic;',
      'ContainsMethods.unboundStatic as any;',

      'instance.unbound || 0;',
      'ContainsMethods.unboundStatic || 0;',

      'instance.unbound ? instance.unbound : null',
    ]),
    {
      code: `
class ContainsMethods {
  unbound?(): void;

  static unboundStatic?(): void;
}

new ContainsMethods().unbound;

ContainsMethods.unboundStatic;
      `,
      errors: [
        {
          line: 8,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
      options: [
        {
          ignoreStatic: true,
        },
      ],
    },
    // https://github.com/typescript-eslint/typescript-eslint/issues/496
    {
      code: `
class CommunicationError {
  foo() {}
}
const x = CommunicationError.prototype.foo;
      `,
      errors: [
        {
          line: 5,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      // Promise.all is not auto-bound to Promise
      code: 'const x = Promise.all;',
      errors: [
        {
          line: 1,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound() {}
}
const instance = new Foo();

let x;

x = instance.unbound; // THIS SHOULD ERROR
instance.unbound = x; // THIS SHOULD NOT
      `,
      errors: [
        {
          line: 9,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo extends Number {
  static parseInt = function (string: string, radix?: number): number {};
}
const foo = Foo;
['1', '2', '3'].map(foo.parseInt);
      `,
      errors: [
        {
          line: 6,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
declare const foo: Number;
const x = foo.toFixed;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
declare const foo: Object;
const x = foo.hasOwnProperty;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
declare const foo: String;
const x = foo.slice;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
declare const foo: Date;
const x = foo.getTime;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo extends Number {}
const x = Foo.parseInt;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo extends String {}
const x = Foo.fromCharCode;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo extends Object {}
const x = Foo.defineProperty;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo extends Date {}
const x = Foo.parse;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
const unbound = new Foo().unbound;
      `,
      errors: [
        {
          line: 5,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound() {}
}
const { unbound } = new Foo();
      `,
      errors: [
        {
          line: 5,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
const { unbound } = new Foo();
      `,
      errors: [
        {
          line: 5,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound() {}
}
let unbound;
({ unbound } = new Foo());
      `,
      errors: [
        {
          line: 6,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
let unbound;
({ unbound } = new Foo());
      `,
      errors: [
        {
          line: 6,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
function foo({ unbound }: Foo = new Foo()) {}
      `,
      errors: [
        {
          line: 5,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
declare const bar: Foo;
function foo({ unbound }: Foo = bar) {}
      `,
      errors: [
        {
          line: 6,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
declare const bar: Foo;
function foo({ unbound }: Foo = { unbound: () => {} }) {}
      `,
      errors: [
        {
          line: 6,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
declare const bar: Foo;
function foo({ unbound }: Foo = { unbound: function () {} }) {}
      `,
      errors: [
        {
          line: 6,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
function foo({ unbound }: Foo) {}
      `,
      errors: [
        {
          line: 5,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
function bar(cb: (arg: Foo) => void) {}
bar(({ unbound }) => {});
      `,
      errors: [
        {
          line: 6,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
function bar(cb: (arg: { unbound: () => void }) => void) {}
bar(({ unbound } = new Foo()) => {});
      `,
      errors: [
        {
          line: 6,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
for (const { unbound } of [new Foo(), new Foo()]) {
}
      `,
      errors: [
        {
          line: 5,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};

  foo({ unbound }: Foo) {}
}
      `,
      errors: [
        {
          line: 5,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
class Bar {
  unbound = function () {};
}
function foo({ unbound }: Foo | Bar) {}
      `,
      errors: [
        {
          line: 8,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
function foo({ unbound }: { unbound: () => string } | Foo) {}
      `,
      errors: [
        {
          line: 5,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
class Bar {
  unbound = () => {};
}
function foo({ unbound }: Foo | Bar) {}
      `,
      errors: [
        {
          line: 8,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
const foo = ({ unbound }: Foo & { foo: () => 'bar' }) => {};
      `,
      errors: [
        {
          line: 5,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
class Bar {
  unbound = () => {};
}
const foo = ({ unbound }: (Foo & { foo: () => 'bar' }) | Bar) => {};
      `,
      errors: [
        {
          line: 8,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};
}
class Bar {
  unbound = () => {};
}
const foo = ({ unbound }: Foo & Bar) => {};
      `,
      errors: [
        {
          line: 8,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: `
class Foo {
  unbound = function () {};

  other = function () {};
}
class Bar {
  unbound = () => {};
}
const foo = ({ unbound, ...rest }: Foo & Bar) => {};
      `,
      errors: [
        {
          line: 10,
          messageId: 'unbound',
        },
      ],
    },
    {
      code: 'const { unbound } = { unbound: function () {} };',
      errors: [
        {
          line: 1,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
function foo(
  { unbound }: { unbound: () => void } = { unbound: function () {} },
) {}
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class Foo {
  floor = function () {};
}

const { floor } = Math.random() > 0.5 ? new Foo() : Math;
      `,
      errors: [
        {
          line: 6,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class CommunicationError {
  foo() {}
}
const { foo } = CommunicationError.prototype;
      `,
      errors: [
        {
          line: 5,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
class CommunicationError {
  foo() {}
}
let foo;
({ foo } = CommunicationError.prototype);
      `,
      errors: [
        {
          line: 6,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
import { console } from './class';
const { log } = console;
      `,
      errors: [
        {
          line: 3,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: 'const { all } = Promise;',
      errors: [
        {
          line: 1,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    // https://github.com/typescript-eslint/typescript-eslint/issues/1866
    {
      code: `
class BaseClass {
  logThis() {}
}
class OtherClass extends BaseClass {
  constructor() {
    super();
    const x = super.logThis;
  }
}
      `,
      errors: [
        {
          column: 15,
          line: 8,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    // https://github.com/typescript-eslint/typescript-eslint/issues/1866
    {
      code: `
class BaseClass {
  logThis() {}
}
class OtherClass extends BaseClass {
  constructor() {
    super();
    let x;
    x = super.logThis;
  }
}
      `,
      errors: [
        {
          column: 9,
          line: 9,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
const values = {
  a() {},
  b: () => {},
};

const { a, b } = values;
      `,
      errors: [
        {
          column: 9,
          endColumn: 10,
          line: 7,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
const values = {
  a() {},
  b: () => {},
};

const { a: c } = values;
      `,
      errors: [
        {
          column: 9,
          endColumn: 10,
          line: 7,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    {
      code: `
const values = {
  a() {},
  b: () => {},
};

const { b, a } = values;
      `,
      errors: [
        {
          column: 12,
          endColumn: 13,
          line: 7,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
    // https://github.com/typescript-eslint/typescript-eslint/issues/8636
    {
      code: `
const objectLiteral = {
  f: function () {},
};
const f = objectLiteral.f;
      `,
      errors: [
        {
          line: 5,
          messageId: 'unboundWithoutThisAnnotation',
        },
      ],
    },
  ],
});
