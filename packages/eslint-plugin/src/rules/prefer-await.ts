import { DefinitionType } from '@typescript-eslint/scope-manager';
import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule, formatWordList } from '../util';

const {
  findVariable,
  getFunctionHeadLocation,
} = require('@eslint-community/eslint-utils');
const isMemberExpression = (
  node: TSESTree.Expression,
  options: {
    object?: string;
    property?: string;
    properties: string[];
    optional?: undefined;
  },
): node is TSESTree.MemberExpression => {
  if (node.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  let { property, properties, object, optional } = {
    property: '',
    object: '',
    ...options,
  };

  let objects;

  if (property) {
    properties = [property];
  }

  if (object) {
    objects = [object];
  }

  if (
    (optional === true && node.optional !== optional) ||
    (optional === false &&
      // `node.optional` can be `undefined` in some parsers
      node.optional)
  ) {
    return false;
  }

  if (
    node.property.type !== 'Identifier' ||
    !properties.includes(node.property.name)
  ) {
    return false;
  }

  if (
    // `node.computed` can be `undefined` in some parsers
    node.computed
  ) {
    return false;
  }

  if (
    Array.isArray(objects) &&
    objects.length > 0 &&
    (node.object.type !== 'Identifier' || !objects.includes(node.object.name))
  ) {
    return false;
  }

  return true;
};
const isMethodCall = (node: TSESTree.Node) => {
  const method = '';
  const methods = ['all', 'allSettled', 'any', 'race'];

  if (node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  let {
    argumentsLength,
    minimumArguments,
    maximumArguments,
    allowSpreadElement,
    optional,
  } = {
    argumentsLength: 1,
    minimumArguments: undefined,
    maximumArguments: undefined,
    allowSpreadElement: undefined,
    optional: undefined,
  };
  let names = undefined;

  if (
    (optional === true && node.optional !== optional) ||
    (optional === false &&
      // `node.optional` can be `undefined` in some parsers
      node.optional)
  ) {
    return false;
  }

  if (
    typeof argumentsLength === 'number' &&
    node.arguments.length !== argumentsLength
  ) {
    return false;
  }

  if (minimumArguments !== 0 && node.arguments.length < minimumArguments) {
    return false;
  }

  if (
    Number.isFinite(maximumArguments) &&
    node.arguments.length > maximumArguments
  ) {
    return false;
  }

  if (!allowSpreadElement) {
    const maximumArgumentsLength = Number.isFinite(maximumArguments)
      ? maximumArguments
      : argumentsLength;
    if (
      typeof maximumArgumentsLength === 'number' &&
      node.arguments.some(
        (node, index) =>
          node.type === AST_NODE_TYPES.SpreadElement &&
          index < maximumArgumentsLength,
      )
    ) {
      return false;
    }
  }

  if (
    Array.isArray(names) &&
    names.length > 0 &&
    (node.callee.type !== AST_NODE_TYPES.Identifier ||
      !names.includes(node.callee.name))
  ) {
    return false;
  }

  return isMemberExpression(node.callee, {
    object: 'Promise',
    property: method,
    properties: methods,
    optional: undefined,
  });
};

const ERROR_PROMISE = 'promise';
const ERROR_IIFE = 'iife';
const ERROR_IDENTIFIER = 'identifier';
const SUGGESTION_ADD_AWAIT = 'add-await';
const messages = {
  [ERROR_PROMISE]: 'Prefer top-level await over using a promise chain.',
  [ERROR_IIFE]: 'Prefer top-level await over an async IIFE.',
  [ERROR_IDENTIFIER]:
    'Prefer top-level await over an async function `{{name}}` call.',
  [SUGGESTION_ADD_AWAIT]: 'Insert `await`.',
};

const promisePrototypeMethods = ['then', 'catch', 'finally'];
const isTopLevelCallExpression = (node: TSESTree.Node): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (
      [
        AST_NODE_TYPES.FunctionDeclaration,
        AST_NODE_TYPES.FunctionExpression,
        AST_NODE_TYPES.ArrowFunctionExpression,
        AST_NODE_TYPES.ClassDeclaration,
        AST_NODE_TYPES.ClassExpression,
      ].includes(ancestor.type)
    ) {
      return false;
    }
  }

  return true;
};

const isAwaitExpressionArgument = (node: TSESTree.Expression) => {
  if (node.parent.type === AST_NODE_TYPES.ChainExpression) {
    node = node.parent;
  }

  return (
    node.parent.type === AST_NODE_TYPES.AwaitExpression &&
    node.parent.argument === node
  );
};

// `Promise.{all,allSettled,any,race}([foo()])`
export default createRule({
  create(context) {
    if (context.filename.toLowerCase().endsWith('.cjs')) {
      return;
    }

    return {
      CallExpression(node): void {
        if (
          !isTopLevelCallExpression(node) ||
          (node.parent.type === AST_NODE_TYPES.MemberExpression &&
            node.parent.object === node &&
            !node.parent.computed &&
            node.parent.property.type === AST_NODE_TYPES.Identifier &&
            promisePrototypeMethods.includes(node.parent.property.name) &&
            node.parent.parent.type === AST_NODE_TYPES.CallExpression &&
            node.parent.parent.callee === node.parent) ||
          isAwaitExpressionArgument(node) ||
          (node.parent.type === AST_NODE_TYPES.ArrayExpression &&
            node.parent.elements.includes(node) &&
            isMethodCall(node.parent.parent) &&
            node.parent.parent.arguments[0] === node.parent)
        ) {
          return;
        }

        // Promises
        const { callee } = node;
        if (
          isMemberExpression(callee, {
            properties: promisePrototypeMethods,
          })
        ) {
          context.report({
            node: callee.property,
            messageId: ERROR_PROMISE,
          });
          return;
        }

        const { sourceCode } = context;

        // IIFE
        if (
          (callee.type === 'FunctionExpression' ||
            callee.type === 'ArrowFunctionExpression') &&
          callee.async &&
          !callee.generator
        ) {
          context.report({
            node,
            loc: getFunctionHeadLocation(callee, sourceCode),
            messageId: ERROR_IIFE,
          });
          return;
        }

        // Identifier
        if (callee.type !== 'Identifier') {
          return;
        }

        const variable = findVariable(sourceCode.getScope(node), callee);
        if (!variable || variable.defs.length !== 1) {
          return;
        }

        const [definition] = variable.defs;
        const value =
          definition.type === DefinitionType.Variable &&
          definition.kind === 'const'
            ? definition.node.init
            : definition.node;
        if (
          !value ||
          !(
            [
              'FunctionDeclaration',
              'FunctionExpression',
              'ArrowFunctionExpression',
            ].includes(value.type) &&
            !value.generator &&
            value.async
          )
        ) {
          return;
        }

        context.report({
          node,
          messageId: ERROR_IDENTIFIER,
          data: { name: callee.name },
          suggest: [
            {
              messageId: SUGGESTION_ADD_AWAIT,
              fix: fixer => fixer.insertTextBefore(node, 'await '),
            },
          ],
        });
      },
    };
  },
  meta: {
    type: 'suggestion',
    docs: {
      description: `Enforce using \`await\` instead of ${formatWordList(promisePrototypeMethods)}.`,
    },
    hasSuggestions: true,
    messages,
    schema: [],
  },
});
