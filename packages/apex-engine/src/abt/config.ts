import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Plugin } from 'rollup';

export type BuildPlugin = Plugin | Promise<Plugin>;

export interface BuildConfig {
  outDir?: string;
  plugins?: BuildPlugin[];
}

export type Platform = 'browser' | 'electron' | 'node';

export type Target = 'client' | 'game' | 'server';

export interface TargetConfig {
  defaultLevel: string;
  platform: Platform;
  target: Target;
}

export interface ApexConfig {
  build?: BuildConfig;
  targets: TargetConfig[];
}

export interface ResolvedConfig {}

export interface InlineConfig {
  configFile?: string;
  target?: Target;
}

export const CONFIG_FILE_NAME = 'apex.config';
export const APEX_DIR = join(fileURLToPath(import.meta.url), '../../../.apex');

export function defineConfig(config: ApexConfig) {
  return config;
}
