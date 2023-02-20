import { resolve } from 'node:path';
import { Plugin } from 'rollup';

export type PluginOption =
  | Plugin
  | false
  | null
  | undefined
  | PluginOption[]
  | Promise<Plugin | false | null | undefined | PluginOption[]>;

export interface BuildConfig {
  outDir?: string;
}

export type Platform = 'browser' | 'electron' | 'node';

export type Target = 'client' | 'game' | 'server';

export interface TargetConfig {
  defaultLevel: string;
  platform: Platform;
  target: Target;
  plugins?: PluginOption[];
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
export const TMP_DIR = resolve(process.cwd(), 'node_modules', '.apexengine');

export function defineConfig(config: ApexConfig) {
  return config;
}
