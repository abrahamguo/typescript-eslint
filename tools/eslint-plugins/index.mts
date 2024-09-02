console.log(
  Object.fromEntries(
    Object.entries(
      (
        Object as typeof Object & {
          groupBy: <T>(
            arr: T[],
            fn: (item: T) => string,
          ) => Record<string, T[]>;
        }
      ).groupBy(
        (
          (await import(`../../.nx/cache/eslint-plugins.json`)) as {
            default: { messages: { ruleId: string }[] }[];
          }
        ).default.flatMap(({ messages }) => messages),
        ({ ruleId }) => ruleId,
      ),
    )
      .filter(
        ([name]) =>
          !/^(sonarjs\/(bool-param-default|cyclomatic-complexity|elseif-without-else|expression-complexity|file-header|fixme-tag|for-in|function-return-type|max-switch-cases|nested-control-flow|no-(array-index-key|empty-interface|nested-(assignment|conditional))|regex-complexity|sonar-max-lines(-per-function)?)|unicorn\/(no-(await-expression-member|nested-ternary|static-only-class)|prefer-(set-has|string-raw)|prevent-abbreviations|set-has|switch-case-braces))$/.test(
            name,
          ),
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ruleId, results]) => [ruleId, results.length]),
  ),
);
