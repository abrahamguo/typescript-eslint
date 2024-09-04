import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../util';

export default createRule({
  name: 'no-confusing-non-null-assertion',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-null assertion in locations that may be confusing',
      recommended: 'stylistic',
    },
    hasSuggestions: true,
    messages: {
      confusing:
        'Confusing combination of non-null assertion and "{{operator}}" like "a! {{operator}} b", which looks very similar to not-{{similarTest}} "a !{{operator}} b".',
      notNeeded: 'Unnecessary non-null assertion (!) in {{operation}}.',
      wrapUpLeft:
        'Wrap up left hand to avoid putting non-null assertion "!" and "{{operator}}" together.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      'BinaryExpression, AssignmentExpression'(
        node: TSESTree.AssignmentExpression | TSESTree.BinaryExpression,
      ): void {
        function isLeftHandPrimaryExpression(
          node: TSESTree.Expression | TSESTree.PrivateIdentifier,
        ): boolean {
          return node.type === AST_NODE_TYPES.TSNonNullExpression;
        }

        const { operator } = node;
        const data = [
          {
            operator: '=',
            operation: 'assignment left hand',
            similarTest: 'equal',
          },
          { operator: '==', operation: 'equal test', similarTest: 'equal' },
          { operator: '===', operation: 'equal test', similarTest: 'equal' },
          { operator: 'in', operation: 'in test', similarTest: 'in' },
          {
            operator: 'instanceof',
            operation: 'instanceof test',
            similarTest: 'instanceof',
          },
        ].find(data => data.operator === operator);
        if (data) {
          const leftHandFinalToken = context.sourceCode.getLastToken(node.left);
          const tokenAfterLeft = context.sourceCode.getTokenAfter(node.left);
          if (
            leftHandFinalToken?.type === AST_TOKEN_TYPES.Punctuator &&
            leftHandFinalToken.value === '!' &&
            tokenAfterLeft?.value !== ')'
          ) {
            const operation =
              operator === '=' ? 'assignment left hand' : 'equal test';
            context.report({
              node,
              messageId: 'confusing',
              data,
              suggest: [
                isLeftHandPrimaryExpression(node.left)
                  ? {
                      messageId: 'notNeeded',
                      data: { operation },
                      fix: (fixer): TSESLint.RuleFix[] => [
                        fixer.replaceText(leftHandFinalToken, ' '),
                      ],
                    }
                  : {
                      messageId: 'wrapUpLeft',
                      data: { operator },
                      fix: (fixer): TSESLint.RuleFix[] => [
                        fixer.insertTextBefore(node.left, '('),
                        fixer.insertTextAfter(node.left, ')'),
                      ],
                    },
              ],
            });
          }
        }
      },
    };
  },
});
