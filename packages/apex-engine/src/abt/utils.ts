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

import { createFilter as _createFilter } from '@rollup/pluginutils';
import { builtinModules } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as resolve from 'resolve';

const builtins = new Set([
  ...builtinModules,
  'assert/strict',
  'diagnostics_channel',
  'dns/promises',
  'fs/promises',
  'path/posix',
  'path/win32',
  'readline/promises',
  'stream/consumers',
  'stream/promises',
  'stream/web',
  'timers/promises',
  'util/types',
  'wasi'
]);

export const bareImportRE = /^[\w@](?!.*:\/\/)/;

export function isBuiltin(id: string): boolean {
  return builtins.has(id.replace(/^node:/, ''));
}

export function cleanUrl(url: string): string {
  return url.replace(/#.*$/s, '').replace(/\?.*$/s, '');
}

export function resolveFrom(id: string, basedir: string, preserveSymlinks = false): string {
  return resolve.sync(id, {
    basedir,
    paths: [],
    extensions: ['.ts'],
    preserveSymlinks
  });
}

export type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null;

export const createFilter = _createFilter as (
  include?: FilterPattern,
  exclude?: FilterPattern,
  options?: { resolve?: string | false | null }
) => (id: string | unknown) => boolean;

interface LookupFileOptions {
  pathOnly?: boolean;
  rootDir?: string;
  predicate?: (file: string) => boolean;
}

export function lookupFile(
  dir: string,
  formats: string[],
  options?: LookupFileOptions
): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const result = options?.pathOnly ? fullPath : fs.readFileSync(fullPath, 'utf-8');
      if (!options?.predicate || options.predicate(result)) {
        return result;
      }
    }
  }
  const parentDir = path.dirname(dir);
  if (parentDir !== dir && (!options?.rootDir || parentDir.startsWith(options?.rootDir))) {
    return lookupFile(parentDir, formats, options);
  }
}
