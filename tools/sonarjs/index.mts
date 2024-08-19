console.log(
  Object.groupBy(
    (
      (await import(`./index.json`)) as {
        default: { messages: { ruleId: string }[] }[];
      }
    ).default.flatMap(({ messages }) => messages),
    ({ ruleId }) => ruleId,
  ),
);
