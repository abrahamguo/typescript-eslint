console.log(
  Object.fromEntries(
    Object.entries(
      Object.groupBy(
        (
          (await import(`./index.json`)) as {
            default: { messages: { ruleId: string }[] }[];
          }
        ).default.flatMap(({ messages }) => messages),
        ({ ruleId }) => ruleId,
      ),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ).map(([ruleId, results]) => [ruleId, results!.length]),
  ),
);
