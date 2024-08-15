const baseConfig = require('../../jest.config.base.ts');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    './tests/test-utils/serializers/index.ts',
  ],
};
