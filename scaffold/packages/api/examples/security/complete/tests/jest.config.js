export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  collectCoverageFrom: [
    '../**/*.ts',
    '!../**/*.test.ts',
    '!../**/*.spec.ts',
    '!../node_modules/**',
    '!../dist/**',
    '!../tests/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@ai-partner-x/aiko-boot/(.*)$': '<rootDir>/../../../packages/aiko-boot/src/$1',
    '^@ai-partner-x/aiko-boot-starter-security/(.*)$': '<rootDir>/../../../packages/aiko-boot-starter-security/src/$1',
    '^@ai-partner-x/aiko-boot-starter-orm/(.*)$': '<rootDir>/../../../packages/aiko-boot-starter-orm/src/$1',
    '^@ai-partner-x/aiko-boot-starter-validation/(.*)$': '<rootDir>/../../../packages/aiko-boot-starter-validation/src/$1',
    '^@ai-partner-x/aiko-boot-starter-web/(.*)$': '<rootDir>/../../../packages/aiko-boot-starter-web/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
