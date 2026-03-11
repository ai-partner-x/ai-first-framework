import type { SecurityProperties } from './auto-configuration.js';

export type { SecurityProperties };

declare module '@ai-partner-x/aiko-boot' {
  interface AppConfig {
    security?: SecurityProperties;
  }
}
