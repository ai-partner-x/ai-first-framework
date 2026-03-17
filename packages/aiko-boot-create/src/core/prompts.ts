import readline from 'readline';

export type Prompter = {
  input: (question: string, defaultValue?: string) => Promise<string>;
  confirm: (question: string, defaultValue?: boolean) => Promise<boolean>;
};

export function createPrompter(): Prompter {
  return {
    async input(question: string, defaultValue?: string): Promise<string> {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const suffix = defaultValue !== undefined ? ` (${defaultValue})` : '';
      return new Promise((resolve) => {
        rl.question(`${question}${suffix}: `, (answer) => {
          rl.close();
          const trimmed = answer.trim();
          if (!trimmed && defaultValue !== undefined) {
            resolve(defaultValue);
          } else {
            resolve(trimmed);
          }
        });
      });
    },

    async confirm(question: string, defaultValue = false): Promise<boolean> {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const hint = defaultValue ? 'Y/n' : 'y/N';
      return new Promise((resolve) => {
        rl.question(`${question} [${hint}]: `, (answer) => {
          rl.close();
          const lower = answer.trim().toLowerCase();
          if (!lower) {
            resolve(defaultValue);
          } else {
            resolve(lower === 'y' || lower === 'yes');
          }
        });
      });
    },
  };
}

