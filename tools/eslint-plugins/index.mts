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
          !/^(sonarjs\/(bool-param-default|cyclomatic-complexity|elseif-without-else|file-header|nested-control-flow)|unicorn\/(prevent-abbreviations|set-has|switch-case-braces))$/.test(
            name,
          ),
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ruleId, results]) => [ruleId, results.length]),
  ),
);
