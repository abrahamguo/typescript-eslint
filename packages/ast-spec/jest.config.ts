import baseConfig from '../../jest.config.base';

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  collectCoverage: false,
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    './tests/util/setupJest.ts',
  ],
};
