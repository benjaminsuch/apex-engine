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

import { createFilter, resolveFrom } from './utils';

const isDebug = process.env.DEBUG;

export interface PackageData {
  dir: string;
  hasSideEffects: (id: string) => boolean | 'no-treeshake';
  webResolvedImports: Record<string, string | undefined>;
  nodeResolvedImports: Record<string, string | undefined>;
  setResolvedCache: (key: string, entry: string, targetWeb: boolean) => void;
  getResolvedCache: (key: string, targetWeb: boolean) => string | undefined;
  data: {
    [field: string]: any;
    name: string;
    type: string;
    version: string;
    main: string;
    module: string;
    browser: string | Record<string, string | false>;
    exports: string | Record<string, any> | string[];
    dependencies: Record<string, string>;
  };
}

export type PackageCache = Map<string, PackageData>;

export function resolvePackageData(
  id: string,
  basedir: string,
  preserveSymlinks = false,
  packageCache?: PackageCache
): PackageData | null {
  let pkg: PackageData | undefined;
  let cacheKey: string | undefined;

  if (packageCache) {
    cacheKey = [id, basedir, preserveSymlinks].join('&');

    if ((pkg = packageCache.get(cacheKey))) {
      return pkg;
    }
  }

  let pkgPath: string | undefined;

  try {
    pkgPath = resolveFrom(`${id}/package.json`, basedir, preserveSymlinks);
    pkg = loadPackageData(pkgPath, true, packageCache);

    if (packageCache) {
      packageCache.set(cacheKey!, pkg);
    }

    return pkg;
  } catch (error) {
    if (error instanceof SyntaxError) {
      isDebug && console.log(`Parsing failed: ${pkgPath}`);
    }
    // Ignore error for missing package.json
    else if ((error as any).code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }

  return null;
}

export function loadPackageData(
  pkgPath: string,
  preserveSymlinks?: boolean,
  packageCache?: PackageCache
): PackageData {
  if (!preserveSymlinks) {
    pkgPath = fs.realpathSync.native(pkgPath);
  }

  let cached: PackageData | undefined;

  if ((cached = packageCache?.get(pkgPath))) {
    return cached;
  }

  const data = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const pkgDir = path.dirname(pkgPath);

  const { sideEffects } = data;

  let hasSideEffects: (id: string) => boolean;

  if (typeof sideEffects === 'boolean') {
    hasSideEffects = () => sideEffects;
  } else if (Array.isArray(sideEffects)) {
    const finalPackageSideEffects = sideEffects.map(sideEffect => {
      /*
       * The array accepts simple glob patterns to the relevant files... Patterns like *.css, which do not include a /, will be treated like **\/*.css.
       * https://webpack.js.org/guides/tree-shaking/
       * https://github.com/vitejs/vite/pull/11807
       */
      if (sideEffect.includes('/')) {
        return sideEffect;
      }
      return `**/${sideEffect}`;
    });

    hasSideEffects = createFilter(finalPackageSideEffects, null, {
      resolve: pkgDir
    });
  } else {
    hasSideEffects = () => true;
  }

  const pkg: PackageData = {
    dir: pkgDir,
    data,
    hasSideEffects,
    webResolvedImports: {},
    nodeResolvedImports: {},
    setResolvedCache(key: string, entry: string, targetWeb: boolean) {
      if (targetWeb) {
        pkg.webResolvedImports[key] = entry;
      } else {
        pkg.nodeResolvedImports[key] = entry;
      }
    },
    getResolvedCache(key: string, targetWeb: boolean) {
      if (targetWeb) {
        return pkg.webResolvedImports[key];
      } else {
        return pkg.nodeResolvedImports[key];
      }
    }
  };

  packageCache?.set(pkgPath, pkg);
  return pkg;
}
