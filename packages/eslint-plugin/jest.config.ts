/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require('../../jest.config.base.ts'),
  coveragePathIgnorePatterns: ['src/index.ts$', 'src/configs/.*.ts$'],
  // intentionally empty, to exclude node_modules from ignore (we need to transform ESM dependencies)
  transformIgnorePatterns: [],
};
