declare module 'sql.js' {
  export interface SqlJsInitConfig {
    locateFile?: (file: string, prefix: string) => string;
  }

  export interface SqlJsDatabase {
    run(sql: string, params?: unknown[]): void;
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: new () => SqlJsDatabase;
  }

  export default function initSqlJs(config?: SqlJsInitConfig): Promise<SqlJsStatic>;
}

