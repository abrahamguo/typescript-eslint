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
          !/^(sonarjs\/(bool-param-default|cyclomatic-complexity|elseif-without-else|expression-complexity|file-header|fixme-tag|for-in|function-return-type|max-(switch-cases|union-size)|nested-control-flow|no-(array-index-key|empty-interface|nested-(assignment|conditional|functions|incdec|switch))|regex-complexity|sonar-max-lines(-per-function)?)|unicorn\/(better-regex|catch-error-name|no-(array-(callback-reference|for-each|push-push|reduce)|await-expression-member|keyword-prefix|negated-condition|nested-ternary|null|process-exit|static-only-class)|prefer-(native-coercion-functions|set-has|str(ing-raw|uctured-clone)|ternary)|prevent-abbreviations|set-has|switch-case-braces))$/.test(
            name,
          ),
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ruleId, results]) => [ruleId, results.length]),
  ),
);
