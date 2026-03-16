export type Logger = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
};

export function createCliLogger(): Logger {
  return {
    info: (msg: string) => {
      // eslint-disable-next-line no-console
      console.log(msg);
    },
    warn: (msg: string) => {
      // eslint-disable-next-line no-console
      console.warn(msg);
    },
    error: (msg: string) => {
      // eslint-disable-next-line no-console
      console.error(msg);
    },
  };
}

