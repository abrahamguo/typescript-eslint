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
          !/^(sonarjs\/(bool-param-default|c(ognitive|yclomatic)-complexity|elseif-without-else|expression-complexity|file-header|fixme-tag|for-in|function-return-type|max-(switch-cases|union-size)|nested-control-flow|no-(array-index-key|empty-interface|nested-(assignment|conditional|functions|incdec|switch))|regex-complexity|sonar-max-lines(-per-function)?|switch-without-default)|unicorn\/(better-regex|catch-error-name|numeric-separators-style|no-(array-(callback-reference|for-each|length-as-slice-end|method-this-argument|push-push|reduce)|await-expression-member|for-loop|keyword-prefix|negated-condition|nested-ternary|null|process-exit|static-only-class|useless-switch-case)|prefer-(native-coercion-functions|set-has|str(ing-raw|uctured-clone)|switch|ternary)|prevent-abbreviations|set-has|switch-case-braces))$/.test(
            name,
          ),
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ruleId, results]) => [ruleId, results.length]),
  ),
);
