module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@cc/types$': '<rootDir>/../../../packages/types/src',
    '^@cc/validation$': '<rootDir>/../../../packages/validation/src',
    '^@cc/shared$': '<rootDir>/../../../packages/shared/src',
  },
};
