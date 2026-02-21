module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/main.ts',
    '<rootDir>/src/index.html',
    '<rootDir>/src/app/app.config.ts',
    '<rootDir>/src/app/app.routes.ts',
    '<rootDir>/src/environments/',
    '<rootDir>/src/app/features/legacy2-modern/data-access/',
    '<rootDir>/src/app/features/legacy2-modern/domain/',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
    },
  },
};
