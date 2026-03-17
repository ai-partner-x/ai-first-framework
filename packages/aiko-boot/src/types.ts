/**
 * Core type definitions for domain layer
 */

/**
 * Service options (like Spring @Service)
 */
export interface ServiceOptions {
  /** Service name */
  name?: string;
  /** Description */
  description?: string;
}

/**
 * Options for the @Async decorator
 */
export interface AsyncOptions {
  /**
   * Custom error handler called when the background task throws an unhandled error.
   * Defaults to `console.error`.
   *
   * @param error   - The thrown error
   * @param methodName - The name of the decorated method
   */
  onError?: (error: unknown, methodName: string) => void | Promise<void>;
}
