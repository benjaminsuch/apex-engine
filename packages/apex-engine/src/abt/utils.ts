import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';

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

export function isBuiltin(id: string): boolean {
  return builtins.has(id.replace(/^node:/, ''));
}

export const dynamicImport = new Function('file', 'return import(file)');

export type Launcher = 'browser' | 'electron-main' | 'electron-sandbox' | 'node';

export function getLauncherPath(
  launcher: 'browser' | 'electron-main' | 'electron-sandbox' | 'node'
) {
  return fileURLToPath(new URL(`../src/launch/${launcher}/index.ts`, import.meta.url));
}

export function filterDuplicateOptions<T extends object>(options: T) {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1];
    }
  }
}
