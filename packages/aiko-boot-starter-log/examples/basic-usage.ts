/**
 * Basic usage examples for @ai-partner-x/aiko-boot-starter-log
 */

import {
  Logger,
  LoggerFactory,
  Formatter,
  ConfigLoader,
  getLogger,
  createConsoleLogger,
  createFileLogger,
  createCombinedLogger,
  initLogging,
  initFromEnv,
  autoInit,
  setLevel,
  closeLogging,
  defaultLogger,
  LogLevel,
} from '../src';

// ============================================
// Example 1: Quick start with default logger
// ============================================

function example1() {
  console.log('\n=== Example 1: Default Logger ===\n');

  // Use the default logger directly
  defaultLogger.info('Application started');
  defaultLogger.debug('Debug message', { userId: 123 });
  defaultLogger.warn('Warning message');
  defaultLogger.error('Error message', { code: 'ERR_001' });
}

// ============================================
// Example 2: Create console logger
// ============================================

function example2() {
  console.log('\n=== Example 2: Console Logger ===\n');

  // Create a simple console logger
  const logger = createConsoleLogger('my-app', 'debug');

  logger.info('Info message');
  logger.debug('Debug message', { data: { foo: 'bar' } });
  logger.warn('Warning message');
  logger.error('Error occurred', new Error('Something went wrong'));
}

// ============================================
// Example 3: Create file logger
// ============================================

async function example3() {
  console.log('\n=== Example 3: File Logger ===\n');

  // Create a file logger
  const logger = createFileLogger('file-app', './logs/app.log', {
    level: 'info',
    maxSize: '10m',
    maxFiles: 5,
  });

  logger.info('This will be written to file');
  logger.error('Error logged to file', { error: 'File write error' });

  // Close logger when done
  closeLogging();
}

// ============================================
// Example 4: Create combined logger
// ============================================

async function example4() {
  console.log('\n=== Example 4: Combined Logger ===\n');

  // Create a logger with both console and file outputs
  const logger = createCombinedLogger('combined-app', './logs/combined.log', {
    level: 'debug',
    maxSize: '10m',
    maxFiles: 3,
  });

  logger.info('Logged to both console and file');
  logger.debug('Debug info', { requestId: 'abc-123' });

  closeLogging();
}

// ============================================
// Example 5: Use LoggerFactory
// ============================================

function example5() {
  console.log('\n=== Example 5: Logger Factory ===\n');

  // Initialize logging with custom configuration
  initLogging({
    level: 'debug',
    format: 'pretty',
    colorize: true,
    transports: [
      { type: 'console', level: 'debug', format: 'cli', colorize: true },
    ],
  });

  // Get loggers from factory
  const appLogger = getLogger('app');
  const dbLogger = getLogger('database');
  const apiLogger = getLogger('api');

  appLogger.info('Application initialized');
  dbLogger.debug('Database connected', { host: 'localhost', port: 5432 });
  apiLogger.http('API request received', { method: 'GET', path: '/users' });

  // Change global log level
  setLevel('info');
  appLogger.debug('This will not be logged'); // Below threshold
  appLogger.info('This will be logged');

  closeLogging();
}

// ============================================
// Example 6: Child loggers and context
// ============================================

function example6() {
  console.log('\n=== Example 6: Child Loggers & Context ===\n');

  const logger = createConsoleLogger('parent', 'debug');

  // Create child logger
  const childLogger = logger.child('module');
  childLogger.info('Message from child logger');

  // Create logger with context
  const contextLogger = logger.withContext({ requestId: 'req-123', userId: 456 });
  contextLogger.info('Message with context');
  contextLogger.debug('Debug with context', { extra: 'data' });
}

// ============================================
// Example 7: Error logging
// ============================================

function example7() {
  console.log('\n=== Example 7: Error Logging ===\n');

  const logger = createConsoleLogger('error-demo', 'debug');

  try {
    throw new Error('Something went wrong!');
  } catch (error) {
    // Log error with stack trace
    logger.error('Operation failed', error as Error);
    logger.error('Operation failed with context', error as Error, { operation: 'test' });
  }
}

// ============================================
// Example 8: All log levels
// ============================================

function example8() {
  console.log('\n=== Example 8: All Log Levels ===\n');

  const logger = createConsoleLogger('levels', 'silly');

  logger.error('Error level - critical issues');
  logger.warn('Warn level - warning messages');
  logger.info('Info level - informational messages');
  logger.http('HTTP level - HTTP request logs');
  logger.verbose('Verbose level - detailed info');
  logger.debug('Debug level - debugging info');
  logger.silly('Silly level - everything');

  // Using log method with level
  logger.log('info', 'Using log method');
}

// ============================================
// Example 9: Custom Logger class
// ============================================

function example9() {
  console.log('\n=== Example 9: Custom Logger ===\n');

  // Create logger with custom options
  const logger = new Logger({
    name: 'custom',
    level: 'debug',
    defaultMeta: {
      service: 'my-service',
      version: '1.0.0',
    },
    transports: [
      { type: 'console', level: 'debug', format: 'cli', colorize: true },
    ],
    format: 'pretty',
    colorize: true,
    timestamp: true,
  });

  logger.info('Custom logger message');
  logger.debug('Debug with default meta', { extra: 'value' });
}

// ============================================
// Example 10: Formatter usage
// ============================================

function example10() {
  console.log('\n=== Example 10: Formatter ===\n');

  // Using different formats
  const formats = {
    json: Formatter.json(),
    simple: Formatter.simple(),
    pretty: Formatter.pretty(),
    cli: Formatter.cli(true),
    production: Formatter.production(),
    development: Formatter.development(),
  };

  console.log('Available formats:', Object.keys(formats));

  // Create format by type
  const cliFormat = Formatter.create('cli', true);
  console.log('CLI format created');
}

// ============================================
// Example 11: ConfigLoader usage
// ============================================

function example11() {
  console.log('\n=== Example 11: ConfigLoader ===\n');

  // Get default config
  const defaultConfig = ConfigLoader.getDefault();
  console.log('Default config:', defaultConfig);

  // Load from environment
  const envConfig = ConfigLoader.fromEnv();
  console.log('Env config:', envConfig);

  // Auto load with fallback chain
  const autoConfig = ConfigLoader.load();
  console.log('Auto config:', autoConfig);
}

// ============================================
// Example 12: Initialize from environment
// ============================================

function example12() {
  console.log('\n=== Example 12: Init from Environment ===\n');

  // Set some env vars for demo
  process.env.LOG_LEVEL = 'debug';
  process.env.LOG_FORMAT = 'cli';
  process.env.LOG_COLORIZE = 'true';

  // Initialize from environment
  initFromEnv();

  const logger = getLogger('env-app');
  logger.info('Logger initialized from environment');
  logger.debug('Debug enabled from env');

  // Clean up env vars
  delete process.env.LOG_LEVEL;
  delete process.env.LOG_FORMAT;
  delete process.env.LOG_COLORIZE;

  closeLogging();
}

// ============================================
// Example 13: Auto initialize
// ============================================

function example13() {
  console.log('\n=== Example 13: Auto Init ===\n');

  // Auto-load with default fallback chain
  autoInit();

  const logger = getLogger('auto-app');
  logger.info('Logger auto-initialized');

  closeLogging();
}

// ============================================
// Run all examples
// ============================================

async function main() {
  example1();
  example2();
  // await example3(); // Requires file system access
  // await example4(); // Requires file system access
  example5();
  example6();
  example7();
  example8();
  example9();
  example10();
  example11();
  example12();
  example13();

  console.log('\n=== All examples completed ===\n');
}

main().catch(console.error);