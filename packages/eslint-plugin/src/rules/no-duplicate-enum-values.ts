import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../util';

export default createRule({
  name: 'no-duplicate-enum-values',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow duplicate enum member values',
      recommended: 'recommended',
    },
    hasSuggestions: false,
    messages: {
      duplicateValue: 'Duplicate enum member value {{value}}.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isStringLiteral(
      node: TSESTree.Expression,
    ): node is TSESTree.StringLiteral {
      return (
        node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string'
      );
    }

    function isNumberLiteral(
      node: TSESTree.Expression,
    ): node is TSESTree.NumberLiteral {
      return (
        node.type === AST_NODE_TYPES.Literal && typeof node.value === 'number'
      );
    }

    return {
      TSEnumDeclaration(node: TSESTree.TSEnumDeclaration): void {
        const enumMembers = node.members;
        const seenValues = new Set<number | string>();

        for (const member of enumMembers) {
          if (member.initializer === undefined) {
            continue;
          }

          let value: number | string | undefined;
          if (isStringLiteral(member.initializer)) {
            value = String(member.initializer.value);
          } else if (isNumberLiteral(member.initializer)) {
            value = Number(member.initializer.value);
          }

          if (value === undefined) {
            continue;
          }

          if (seenValues.has(value)) {
            context.report({
              node: member,
              messageId: 'duplicateValue',
              data: {
                value,
              },
            });
          } else {
            seenValues.add(value);
          }
        }
      },
    };
  },
});
