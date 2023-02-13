import { build } from 'esbuild';
import { existsSync, promises, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Plugin } from 'rollup';

import { dynamicImport, isBuiltin } from './utils';

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

const CONFIG_FILE_NAME = 'apex.config';

export function defineConfig(config: ApexConfig) {
  return config;
}

export async function loadConfigFromFile(
  configFile?: InlineConfig['configFile'],
  root: string = process.cwd()
) {
  let resolvedPath: string | undefined;

  if (configFile) {
    resolvedPath = resolve(configFile);
  } else {
    resolvedPath = resolve(root, CONFIG_FILE_NAME + '.ts');
  }

  if (!existsSync(resolvedPath)) {
    throw new Error(`Unable to find configuration file ${resolvedPath}.`);
  }

  // electron does not support adding type: "module" to package.json
  let isESM = false;
  if (/\.m[jt]s$/.test(resolvedPath) || resolvedPath.endsWith('.ts')) {
    isESM = true;
  }

  try {
    const bundled = await bundleConfigFile(resolvedPath, isESM);
    const loadedConfig = await loadConfigFromBundledFile(root, resolvedPath, bundled.code, isESM);
    const config = await (typeof loadedConfig === 'function' ? loadedConfig() : loadedConfig);

    if (typeof config !== 'object' || Array.isArray(config)) {
      throw new Error(`Invalid config: Your configuration file must return an object.`);
    }
  } catch (error) {
    console.log(error);
  }
}

async function bundleConfigFile(fileName: string, isESM: boolean) {
  const dirnameVarName = '__abt_injected_dirname';
  const filenameVarName = '__abt_injected_filename';
  const importMetaUrlVarName = '__abt_injected_import_meta_url';

  const result = await build({
    absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    write: false,
    target: ['node16'],
    platform: 'node',
    bundle: true,
    format: isESM ? 'esm' : 'cjs',
    sourcemap: 'inline',
    metafile: true,
    define: {
      __dirname: dirnameVarName,
      __filename: filenameVarName,
      'import.meta.url': importMetaUrlVarName
    },
    banner: {
      js: [
        'import { createRequire } from "module";',
        'const require = createRequire(import.meta.url);'
      ].join('\n')
    },
    plugins: [
      {
        name: 'externalize-deps',
        setup(build) {
          build.onResolve({ filter: /^[^.].*/ }, ({ path: id }) => {
            if (isAbsolute(id) || isBuiltin(id)) {
              return;
            }
            return null;
          });
        }
      },
      {
        name: 'replace-import-meta',
        setup(build) {
          build.onLoad({ filter: /\.[cm]?[jt]s$/ }, async args => {
            const contents = await promises.readFile(args.path, 'utf8');
            const injectValues =
              `const ${dirnameVarName} = ${JSON.stringify(dirname(args.path))};` +
              `const ${filenameVarName} = ${JSON.stringify(args.path)};` +
              `const ${importMetaUrlVarName} = ${JSON.stringify(pathToFileURL(args.path).href)};`;

            return {
              loader: args.path.endsWith('ts') ? 'ts' : 'js',
              contents: injectValues + contents
            };
          });
        }
      }
    ]
  });

  const { text } = result.outputFiles[0];

  return {
    code: text,
    dependencies: result.metafile ? Object.keys(result.metafile.inputs) : []
  };
}

async function loadConfigFromBundledFile(
  root: string,
  configFile: string,
  bundledCode: string,
  isESM: boolean
) {
  if (isESM) {
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
  } else {
  }
}
