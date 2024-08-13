import type { ESLintPluginRuleModule } from '@typescript-eslint/eslint-plugin/use-at-your-own-risk/rules';
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint';
import * as fs from 'fs';
import * as lz from 'lz-string';
import * as path from 'path';
import type * as unist from 'unist';
import type { VFile } from 'vfile';

import { nodeIsHeading } from './nodes';

export const eslintPluginDirectory = path.resolve(
  path.join(__dirname, '../../../eslint-plugin'),
);

export const sourceUrlPrefix =
  'https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/';

/**
 * @param withComment Whether to include a full comment note.
 * @remarks `withComment` can't be used inside a JSON object which is needed for eslintrc in the playground
 */
export function getEslintrcString(
  extendsBaseRuleName: string,
  stem: string,
  withComment: boolean,
): string {
  return `{
  "rules": {${
    withComment
      ? '\n    // Note: you must disable the base rule as it can report incorrect errors'
      : ''
  }
    "${extendsBaseRuleName}": "off",
    "@typescript-eslint/${stem}": "error"
  }
}`;
}

export function convertToPlaygroundHash(eslintrc: string): string {
  return lz.compressToEncodedURIComponent(eslintrc);
}

export function getUrlForRuleTest(ruleName: string): string {
  for (const localPath of [
    `tests/rules/${ruleName}.test.ts`,
    `tests/rules/${ruleName}/`,
  ]) {
    if (fs.existsSync(`${eslintPluginDirectory}/${localPath}`)) {
      return `${sourceUrlPrefix}${localPath}`;
    }
  }

  throw new Error(`Could not find test file for ${ruleName}.`);
}

export function isESLintPluginRuleModule(
  rule: RuleModule<string, readonly unknown[]> | undefined,
): rule is ESLintPluginRuleModule {
  return !!rule?.meta.docs;
}

export type VFileWithStem = VFile & {
  stem: string;
};

export function isVFileWithStem(file: VFile): file is VFileWithStem {
  return !!file.stem;
}

export function findH2Index(
  children: unist.Node[],
  headingName: string,
): number {
  return children.findIndex(
    node =>
      nodeIsHeading(node) &&
      node.depth === 2 &&
      node.children.length === 1 &&
      node.children[0].type === 'text' &&
      node.children[0].value === headingName,
  );
}
