/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require('../../jest.config.base.ts'),
  coveragePathIgnorePatterns: ['src/index.ts$', 'src/configs/.*.ts$'],
};
