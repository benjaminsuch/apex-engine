/**
 * Parts contain code from the Vite project:
 *
 * Repository: https://github.com/vitejs/vite/tree/main/packages/vite
 * License: https://github.com/vitejs/vite/blob/main/packages/vite/LICENSE.md
 *
 * MIT License
 *
 * Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { build } from 'esbuild';
import { Plugin } from 'rollup';

import {
  tryNodeResolve,
  type InternalResolveOptionsWithOverrideConditions
} from './plugins/resolve';
import { isBuiltin } from './utils';

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

export async function resolveConfig(inlineConfig: InlineConfig): Promise<ResolvedConfig> {
  const result = await loadConfigFromFile(inlineConfig.configFile);
}

export async function loadConfigFromFile(
  configFile?: InlineConfig['configFile'],
  root: string = process.cwd()
) {
  let resolvedPath: string | undefined;

  if (configFile) {
    resolvedPath = path.resolve(configFile);
  } else {
    resolvedPath = path.resolve(root, 'apex.config.ts');
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Unable to find configuration file ${resolvedPath}.`);
  }

  try {
    const bundled = await bundleConfigFile(resolvedPath);
  } catch (error) {}
}

export function defineConfig(config: ApexConfig) {
  return config;
}

async function bundleConfigFile(fileName: string) {
  const result = await build({
    absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    outfile: 'out.js',
    write: false,
    target: ['node16'],
    platform: 'node',
    bundle: true,
    format: 'esm',
    mainFields: ['main'],
    sourcemap: 'inline',
    metafile: true,
    plugins: [
      {
        name: 'externalize-deps',
        setup(build) {
          const options: InternalResolveOptionsWithOverrideConditions = {
            root: path.dirname(fileName),
            isBuild: true,
            isProduction: true,
            preferRelative: false,
            tryIndex: true,
            mainFields: [],
            browserField: false,
            conditions: [],
            overrideConditions: ['node'],
            dedupe: [],
            extensions: ['.ts'],
            preserveSymlinks: false
          };

          build.onResolve({ filter: /^[^.].*/ }, async ({ path: id, importer, kind }) => {
            if (kind === 'entry-point' || path.isAbsolute(id) || isBuiltin(id)) {
              return;
            }

            if (id.startsWith('npm:')) {
              return { external: true };
            }

            let idFsPath = tryNodeResolve(
              id,
              importer,
              { ...options, isRequire: false },
              false
            )?.id;

            if (idFsPath) {
              idFsPath = url.pathToFileURL(idFsPath).href;
            }

            return {
              path: idFsPath,
              external: true
            };
          });
        }
      }
    ]
  });
}
