import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { rollup, type Plugin, type RollupBuild } from 'rollup';

import { dynamicImport } from './utils';

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
export const APEX_DIR = resolve('.apex');

// Using defineConfig in apex.config.ts leads to an MISSING_EXPORTS error for some dependencies :shrug:
/*export function defineConfig(config: ApexConfig) {
  return config;
}*/

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

export async function getApexConfig(configFile: string = resolve(`${CONFIG_FILE_NAME}.ts`)) {
  let bundle: RollupBuild | undefined;
  let config: ApexConfig | undefined;

  try {
    bundle = await rollup({
      input: configFile,
      plugins: [nodeResolve({ preferBuiltins: true }), typescript()],
      onwarn() {}
    });

    const result = await bundle.generate({
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false
    });
    const [chunkOrAsset] = result.output;

    if (chunkOrAsset.type === 'chunk') {
      config = await loadConfigFromBundledFile(process.cwd(), chunkOrAsset.code);
    }
  } catch (error) {
    console.log(error);
    //debug(error);
  }

  if (bundle) {
    await bundle.close();
  }

  if (!config) {
    throw new Error(`No config found.`);
  }

  return config;
}
