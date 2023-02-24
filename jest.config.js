module.exports = {
  preset: 'ts-jest',
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  projects: [
    '<rootDir>',
    '<rootDir>/packages/models',
    '<rootDir>/packages/repo-mock',
  ],
};
