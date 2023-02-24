import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import glob from 'glob';
import { unlinkSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Plugin, type RollupOptions } from 'rollup';

import { dynamicImport, getLauncherPath, type Launcher } from './utils';

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
export const APEX_DIR = join(fileURLToPath(import.meta.url), '../../../.apex');

export function defineConfig(config: ApexConfig) {
  return config;
}

export function getGameMaps() {
  return Object.fromEntries(
    glob
      .sync('src/game/maps/**/*.ts')
      .map(file => [
        relative('src/game', file.slice(0, file.length - extname(file).length)),
        fileURLToPath(pathToFileURL(resolve(file)))
      ])
  );
}

export function createRollupConfig(
  launcher: Launcher,
  { output, ...options }: RollupOptions = {}
): RollupOptions {
  return {
    input: {
      index: getLauncherPath(launcher),
      ...getGameMaps()
    },
    output: {
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline',
      ...output
    },
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    },
    ...options
  };
}

export function createRollupPlugins(buildDir: string, defaultLevel: string) {
  return [
    replace({
      preventAssignment: true,
      values: {
        DEFAULT_LEVEL: JSON.stringify(defaultLevel)
      }
    }),
    nodeResolve({ preferBuiltins: true }),
    typescript({ outDir: buildDir })
  ];
}

export async function loadConfigFromBundledFile(
  root: string,
  bundledCode: string
): Promise<ApexConfig> {
  const fileNameTmp = resolve(root, `${CONFIG_FILE_NAME}.${Date.now()}.mjs`);

  writeFileSync(fileNameTmp, bundledCode);

  const fileUrl = pathToFileURL(fileNameTmp);

  try {
    return (await dynamicImport(fileUrl)).default;
  } finally {
    try {
      unlinkSync(fileNameTmp);
    } catch {}
  }
}
