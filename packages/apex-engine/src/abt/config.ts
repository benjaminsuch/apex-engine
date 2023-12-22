import { unlinkSync, writeFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import glob from 'fast-glob';
import { type Plugin, rollup, type RollupBuild } from 'rollup';

import { dynamicImport } from './utils';

export type Platform = 'browser' | 'electron' | 'node';

export type Target = 'client' | 'game' | 'server';

export type BuildPlugin = Plugin | Promise<Plugin>;

export interface BuildConfig {
  outDir?: string;
  plugins?: BuildPlugin[];
}

export interface TargetConfig {
  defaultMap: string;
  platform: Platform;
  target: Target;
  plugins: any[];
}

export interface ApexConfig {
  build?: BuildConfig;
  targets: TargetConfig[];
}

export const CONFIG_FILE_NAME = 'apex.config';

export const APEX_DIR = resolve('.apex');

export async function getApexConfig(configFile: string = resolve(`${CONFIG_FILE_NAME}.ts`)) {
  let bundle: RollupBuild | undefined;
  let config: ApexConfig | undefined;

  try {
    bundle = await rollup({
      input: configFile,
      plugins: [nodeResolve({ preferBuiltins: true }), typescript()],
      onwarn() {},
    });

    const result = await bundle.generate({
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
    });
    const [chunkOrAsset] = result.output;

    if (chunkOrAsset.type === 'chunk') {
      config = await loadConfigFromBundledFile(process.cwd(), chunkOrAsset.code);
    }
  } catch (error) {
    console.log(error);
  }

  if (bundle) {
    await bundle.close();
  }

  if (!config) {
    throw new Error(`No config found.`);
  }

  return config;
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

export function getLauncherPath(launcher: 'browser' | 'electron-main' | 'electron-sandbox' | 'node') {
  return fileURLToPath(new URL(`../src/launch/${launcher}/index.ts`, import.meta.url));
}

export function getEngineSourceFiles() {
  return Object.fromEntries(
    glob
      .sync('src/engine/**/*.ts')
      .map(file => [
        relative('src', file.slice(0, file.length - extname(file).length)),
        fileURLToPath(pathToFileURL(resolve(file))),
      ])
  );
}
