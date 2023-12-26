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
  'wasi',
]);

export function isBuiltin(id: string): boolean {
  return builtins.has(id.replace(/^node:/, ''));
}

export const dynamicImport = new Function('file', 'return import(file)');

export function filterDuplicateOptions<T extends object>(options: T): void {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1];
    }
  }
}

export interface MeasureReturn {
  done(message?: string): void;
}

export function measure(): MeasureReturn {
  const startTime = performance.now();

  return {
    done(message = 'Operation done in %ss') {
      const endTime = performance.now();
      console.log(message, ((endTime - startTime) / 1000).toFixed(2));
    },
  } as MeasureReturn;
}
