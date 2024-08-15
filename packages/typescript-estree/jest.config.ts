/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require('../../jest.config.base.ts'),
  testRegex: ['./tests/lib/.*\\.test\\.ts$'],
};
