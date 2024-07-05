import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type {
  ReportDescriptor,
  Scope,
} from '@typescript-eslint/utils/ts-eslint';
import * as tsutils from 'ts-api-utils';
import type * as ts from 'typescript';

import {
  createRule,
  getParserServices,
  getStaticValue,
  isParenlessArrowFunction,
  isRestParameterDeclaration,
  nullThrows,
} from '../util';

type MessageIds =
  | 'useUnknown'
  | 'useUnknownSpreadArgs'
  | 'useUnknownArrayDestructuringPattern'
  | 'useUnknownObjectDestructuringPattern'
  | 'addUnknownTypeAnnotationSuggestion'
  | 'addUnknownRestTypeAnnotationSuggestion'
  | 'wrongTypeAnnotationSuggestion'
  | 'wrongRestTypeAnnotationSuggestion';

const useUnknownMessageBase =
  'Prefer the safe `: unknown` for a catch callback variable.';

export default createRule<[], MessageIds>({
  name: 'use-unknown-in-catch-callback-variable',
  meta: {
    docs: {
      description:
        'Enforce typing arguments in `.catch()` callbacks as `unknown`',
      requiresTypeChecking: true,
      recommended: 'strict',
    },
    type: 'suggestion',
    messages: {
      useUnknown: useUnknownMessageBase,
      useUnknownArrayDestructuringPattern:
        useUnknownMessageBase + ' The thrown error may not be iterable.',
      useUnknownObjectDestructuringPattern:
        useUnknownMessageBase +
        ' The thrown error may be nullable, or may not have the expected shape.',
      useUnknownSpreadArgs:
        useUnknownMessageBase +
        ' The argument list may contain a handler that does not use `unknown` for the catch callback variable.',
      addUnknownTypeAnnotationSuggestion:
        'Add an explicit `: unknown` type annotation to the catch variable.',
      addUnknownRestTypeAnnotationSuggestion:
        'Add an explicit `: [unknown]` type annotation to the catch rest variable.',
      wrongTypeAnnotationSuggestion:
        'Change existing type annotation to `: unknown`.',
      wrongRestTypeAnnotationSuggestion:
        'Change existing type annotation to `: [unknown]`.',
    },
    fixable: 'code',
    schema: [],
    hasSuggestions: true,
  },

  defaultOptions: [],

  create(context) {
    const services = getParserServices(context);
    const checker = services.program.getTypeChecker();

    function getArgumentIndexToCheck(node: TSESTree.Expression): 0 | 1 | false {
      if (node.type !== AST_NODE_TYPES.MemberExpression) {
        return false;
      }
      const argIndexToCheck = ['catch', 'then'].findIndex(method =>
        isStaticMemberAccessOfValue(node, method),
      ) as -1 | 0 | 1;
      if (argIndexToCheck === -1) {
        return false;
      }

      const objectTsNode = services.esTreeNodeToTSNodeMap.get(node.object);
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      return (
        tsutils.isThenableType(
          checker,
          tsNode,
          checker.getTypeAtLocation(objectTsNode),
        ) && argIndexToCheck
      );
    }

    function isFlaggableHandlerType(type: ts.Type): boolean {
      for (const unionPart of tsutils.unionTypeParts(type)) {
        const callSignatures = tsutils.getCallSignaturesOfType(unionPart);
        if (callSignatures.length === 0) {
          // Ignore any non-function components to the type. Those are not this rule's problem.
          continue;
        }

        for (const callSignature of callSignatures) {
          const firstParam = callSignature.parameters.at(0);
          if (!firstParam) {
            // it's not an issue if there's no catch variable at all.
            continue;
          }

          let firstParamType = checker.getTypeOfSymbol(firstParam);

          const decl = firstParam.valueDeclaration;
          if (decl != null && isRestParameterDeclaration(decl)) {
            if (checker.isArrayType(firstParamType)) {
              firstParamType = checker.getTypeArguments(firstParamType)[0];
            } else if (checker.isTupleType(firstParamType)) {
              firstParamType = checker.getTypeArguments(firstParamType)[0];
            } else {
              // a rest arg that's not an array or tuple should definitely be flagged.
              return true;
            }
          }

          if (!tsutils.isIntrinsicUnknownType(firstParamType)) {
            return true;
          }
        }
      }

      return false;
    }

    /**
     * If passed an ordinary expression, this will check it as expected.
     *
     * If passed a spread element, it treats it as the union of unwrapped array/tuple type.
     */
    function shouldFlagArgument(
      node: TSESTree.Expression | TSESTree.SpreadElement,
    ): boolean {
      const argument = services.esTreeNodeToTSNodeMap.get(node);
      const typeOfArgument = checker.getTypeAtLocation(argument);
      return isFlaggableHandlerType(typeOfArgument);
    }

    function shouldFlagMultipleSpreadArgs(
      argumentsList: TSESTree.CallExpressionArgument[],
    ): boolean {
      // One could try to be clever about unpacking fixed length tuples and stuff
      // like that, but there's no need, since this is all invalid use of `.catch`
      // anyway at the end of the day. Instead, we'll just check whether any of the
      // possible args types would violate the rule on its own.
      return argumentsList.some(shouldFlagArgument);
    }

    function getSpreadArgsType({ argument }: TSESTree.SpreadElement): ts.Type {
      const spreadArgs = services.esTreeNodeToTSNodeMap.get(argument);
      return checker.getTypeAtLocation(spreadArgs);
    }

    function shouldFlagSingleSpreadArg(node: TSESTree.SpreadElement): boolean {
      const spreadArgsType = getSpreadArgsType(node);

      if (checker.isArrayType(spreadArgsType)) {
        const arrayType = checker.getTypeArguments(spreadArgsType)[0];
        return isFlaggableHandlerType(arrayType);
      }

      if (checker.isTupleType(spreadArgsType)) {
        const firstType = checker.getTypeArguments(spreadArgsType).at(0);
        if (!firstType) {
          // empty spread args. Suspect code, but not a problem for this rule.
          return false;
        }
        return isFlaggableHandlerType(firstType);
      }

      return true;
    }

    /**
     * Analyzes the syntax of the catch argument and makes a best effort to pinpoint
     * why it's reporting, and to come up with a suggested fix if possible.
     *
     * This function is explicitly operating under the assumption that the
     * rule _is reporting_, so it is not guaranteed to be sound to call otherwise.
     */
    function refineReportForNormalArgumentIfPossible(
      argument: TSESTree.Expression,
    ): undefined | Partial<ReportDescriptor<MessageIds>> {
      // Only know how to be helpful if a function literal has been provided.
      if (
        !(
          argument.type === AST_NODE_TYPES.ArrowFunctionExpression ||
          argument.type === AST_NODE_TYPES.FunctionExpression
        )
      ) {
        return undefined;
      }

      const catchVariableOuterWithIncorrectTypes = nullThrows(
        argument.params.at(0),
        'There should have been at least one parameter for the rule to have flagged.',
      );

      // Function expressions can't have parameter properties; those only exist in constructors.
      const catchVariableOuter =
        catchVariableOuterWithIncorrectTypes as Exclude<
          typeof catchVariableOuterWithIncorrectTypes,
          TSESTree.TSParameterProperty
        >;
      const catchVariableInner =
        catchVariableOuter.type === AST_NODE_TYPES.AssignmentPattern
          ? catchVariableOuter.left
          : catchVariableOuter;

      switch (catchVariableInner.type) {
        case AST_NODE_TYPES.Identifier: {
          const catchVariableTypeAnnotation = catchVariableInner.typeAnnotation;
          if (catchVariableTypeAnnotation == null) {
            return {
              node: catchVariableOuter,
              suggest: [
                {
                  messageId: 'addUnknownTypeAnnotationSuggestion',
                  fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix[] => {
                    if (
                      argument.type ===
                        AST_NODE_TYPES.ArrowFunctionExpression &&
                      isParenlessArrowFunction(argument, context.sourceCode)
                    ) {
                      return [
                        fixer.insertTextBefore(catchVariableInner, '('),
                        fixer.insertTextAfter(catchVariableInner, ': unknown)'),
                      ];
                    }

                    return [
                      fixer.insertTextAfter(catchVariableInner, ': unknown'),
                    ];
                  },
                },
              ],
            };
          }

          return {
            node: catchVariableOuter,
            suggest: [
              {
                messageId: 'wrongTypeAnnotationSuggestion',
                fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
                  fixer.replaceText(catchVariableTypeAnnotation, ': unknown'),
              },
            ],
          };
        }
        case AST_NODE_TYPES.ArrayPattern: {
          return {
            node: catchVariableOuter,
            messageId: 'useUnknownArrayDestructuringPattern',
          };
        }
        case AST_NODE_TYPES.ObjectPattern: {
          return {
            node: catchVariableOuter,
            messageId: 'useUnknownObjectDestructuringPattern',
          };
        }
        case AST_NODE_TYPES.RestElement: {
          const catchVariableTypeAnnotation = catchVariableInner.typeAnnotation;
          if (catchVariableTypeAnnotation == null) {
            return {
              node: catchVariableOuter,
              suggest: [
                {
                  messageId: 'addUnknownRestTypeAnnotationSuggestion',
                  fix: (fixer): TSESLint.RuleFix =>
                    fixer.insertTextAfter(catchVariableInner, ': [unknown]'),
                },
              ],
            };
          }
          return {
            node: catchVariableOuter,
            suggest: [
              {
                messageId: 'wrongRestTypeAnnotationSuggestion',
                fix: (fixer): TSESLint.RuleFix =>
                  fixer.replaceText(catchVariableTypeAnnotation, ': [unknown]'),
              },
            ],
          };
        }
      }
    }

    return {
      CallExpression(node): void {
        const args = node.arguments;
        if (args.length === 0) {
          return;
        }
        const argumentIndexToCheck = getArgumentIndexToCheck(node.callee);
        if (argumentIndexToCheck === false) {
          return;
        }

        const [firstArgument] = args;
        const argumentToCheck = args[argumentIndexToCheck];
        // If we are checking a .then() call, we need to check the second argument.
        // But if the first argument is a spread argument, that could affect things, so handle that here.
        if (
          argumentIndexToCheck &&
          firstArgument.type === AST_NODE_TYPES.SpreadElement
        ) {
          const spreadArgsType = getSpreadArgsType(firstArgument);
          // If it's a tuple type with a fixedLength of 1, no special handling needed.
          if (
            checker.isTupleType(spreadArgsType) &&
            spreadArgsType.target.fixedLength !== 1
          ) {
            // If the fixed length is not 1, then check index 1 of this spread type.
            const type = checker.getTypeArguments(spreadArgsType).at(1);
            if (type && isFlaggableHandlerType(type)) {
              context.report({
                node: firstArgument,
                messageId: 'useUnknownSpreadArgs',
              });
            }
            // No further checks needed, as we don't need to go overboard with complex handling.
            return;
          }
          // Too complex to figure out what's going on, so we'll ignore.
          if (checker.isArrayType(spreadArgsType)) {
            return;
          }
        }

        // Deal with some special cases around spread element args.
        // promise.catch(...handlers), promise.catch(...handlers, ...moreHandlers).
        if (argumentToCheck.type === AST_NODE_TYPES.SpreadElement) {
          if (args.length === 1) {
            if (shouldFlagSingleSpreadArg(argumentToCheck)) {
              context.report({
                node: argumentToCheck,
                messageId: 'useUnknown',
              });
            }
          } else if (shouldFlagMultipleSpreadArgs(args)) {
            context.report({
              node,
              messageId: 'useUnknownSpreadArgs',
            });
          }
          return;
        }

        // Argument to check is an "ordinary" argument (i.e. not a spread argument)
        // promise.catch(f), promise.catch(() => {}), promise.catch(<expression>, <<other-args>>)
        if (shouldFlagArgument(argumentToCheck)) {
          // We are now guaranteed to report, but we have a bit of work to do
          // to determine exactly where, and whether we can fix it.
          const overrides =
            refineReportForNormalArgumentIfPossible(argumentToCheck);
          context.report({
            node: argumentToCheck,
            messageId: 'useUnknown',
            ...overrides,
          });
        }
      },
    };
  },
});

/**
 * Answers whether the member expression looks like
 * `x.memberName`, `x['memberName']`,
 * or even `const mn = 'memberName'; x[mn]` (or optional variants thereof).
 */
function isStaticMemberAccessOfValue(
  memberExpression:
    | TSESTree.MemberExpressionComputedName
    | TSESTree.MemberExpressionNonComputedName,
  value: string,
  scope?: Scope.Scope | undefined,
): boolean {
  if (!memberExpression.computed) {
    // x.memberName case.
    return memberExpression.property.name === value;
  }

  // x['memberName'] cases.
  const staticValueResult = getStaticValue(memberExpression.property, scope);
  return staticValueResult != null && value === staticValueResult.value;
}
