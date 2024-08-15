const { getJestProjects } = require('@nx/jest');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: getJestProjects(),
};
