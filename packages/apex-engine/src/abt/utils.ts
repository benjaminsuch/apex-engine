import { builtinModules } from 'node:module';

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
