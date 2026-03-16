import path from 'path';
import fs from 'fs-extra';

export type AikoAppConfig = {
  name: string;
  type: 'admin' | 'mobile' | string;
  path: string;
};

export type AikoApiConfig = {
  name: string;
  path: string;
  db: string;
  features?: string[];
};

export type AikoProjectConfig = {
  version: number;
  scope?: string;
  packageManager?: 'pnpm' | 'npm' | 'yarn';
  apps?: AikoAppConfig[];
  apis?: AikoApiConfig[];
};

const CONFIG_FILE_NAME = '.aiko-boot.json';

export function getProjectConfigPath(rootDir: string): string {
  return path.join(rootDir, CONFIG_FILE_NAME);
}

export async function loadProjectConfig(
  rootDir: string,
): Promise<AikoProjectConfig | null> {
  const configPath = getProjectConfigPath(rootDir);
  if (!(await fs.pathExists(configPath))) {
    return null;
  }
  return fs.readJson(configPath);
}

export async function saveProjectConfig(
  rootDir: string,
  config: AikoProjectConfig,
): Promise<void> {
  const configPath = getProjectConfigPath(rootDir);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

