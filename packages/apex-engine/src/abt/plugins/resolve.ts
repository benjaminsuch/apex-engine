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
import type { BuildOptions as EsbuildBuildOptions } from 'esbuild';
import type { PartialResolvedId } from 'rollup';

import { resolvePackageData, type PackageCache, type PackageData } from '../packages';
import { bareImportRE, cleanUrl, isBuiltin, lookupFile } from '../utils';

const optionalPeerDepId = '__apex-optional-peer-dep';

export type ExportsData = {
  hasImports: boolean;
  // exported names (for `export { a as b }`, `b` is exported name)
  exports: readonly string[];
  facade: boolean;
  // es-module-lexer has a facade detection but isn't always accurate for our
  // use case when the module has default export
  hasReExports?: boolean;
  // hint if the dep requires loading as jsx
  jsxLoader?: boolean;
};

export interface DepOptimizationConfig {
  /**
   * Force optimize listed dependencies (must be resolvable import paths,
   * cannot be globs).
   */
  include?: string[];
  /**
   * Do not optimize these dependencies (must be resolvable import paths,
   * cannot be globs).
   */
  exclude?: string[];
  /**
   * Force ESM interop when importing for these dependencies. Some legacy
   * packages advertise themselves as ESM but use `require` internally
   * @experimental
   */
  needsInterop?: string[];
  /**
   * Options to pass to esbuild during the dep scanning and optimization
   *
   * Certain options are omitted since changing them would not be compatible
   * with Vite's dep optimization.
   *
   * - `external` is also omitted, use Vite's `optimizeDeps.exclude` option
   * - `plugins` are merged with Vite's dep plugin
   *
   * https://esbuild.github.io/api
   */
  esbuildOptions?: Omit<
    EsbuildBuildOptions,
    | 'bundle'
    | 'entryPoints'
    | 'external'
    | 'write'
    | 'watch'
    | 'outdir'
    | 'outfile'
    | 'outbase'
    | 'outExtension'
    | 'metafile'
  >;
  /**
   * List of file extensions that can be optimized. A corresponding esbuild
   * plugin must exist to handle the specific extension.
   *
   * By default, Vite can optimize `.mjs`, `.js`, `.ts`, and `.mts` files. This option
   * allows specifying additional extensions.
   *
   * @experimental
   */
  extensions?: string[];
  /**
   * Disables dependencies optimizations, true disables the optimizer during
   * build and dev. Pass 'build' or 'dev' to only disable the optimizer in
   * one of the modes. Deps optimization is enabled by default in dev only.
   * @default 'build'
   * @experimental
   */
  disabled?: boolean | 'build' | 'dev';
}

export type DepOptimizationOptions = DepOptimizationConfig & {
  /**
   * By default, Vite will crawl your `index.html` to detect dependencies that
   * need to be pre-bundled. If `build.rollupOptions.input` is specified, Vite
   * will crawl those entry points instead.
   *
   * If neither of these fit your needs, you can specify custom entries using
   * this option - the value should be a fast-glob pattern or array of patterns
   * (https://github.com/mrmlnc/fast-glob#basic-syntax) that are relative from
   * vite project root. This will overwrite default entries inference.
   */
  entries?: string | string[];
  /**
   * Force dep pre-optimization regardless of whether deps have changed.
   * @experimental
   */
  force?: boolean;
};

export interface OptimizedDepInfo {
  id: string;
  file: string;
  src?: string;
  needsInterop?: boolean;
  browserHash?: string;
  fileHash?: string;
  /**
   * During optimization, ids can still be resolved to their final location
   * but the bundles may not yet be saved to disk
   */
  processing?: Promise<void>;
  /**
   * ExportData cache, discovered deps will parse the src entry to get exports
   * data used both to define if interop is needed and when pre-bundling
   */
  exportsData?: Promise<ExportsData>;
}

export interface DepOptimizationMetadata {
  /**
   * The main hash is determined by user config and dependency lockfiles.
   * This is checked on server startup to avoid unnecessary re-bundles.
   */
  hash: string;
  /**
   * The browser hash is determined by the main hash plus additional dependencies
   * discovered at runtime. This is used to invalidate browser requests to
   * optimized deps.
   */
  browserHash: string;
  /**
   * Metadata for each already optimized dependency
   */
  optimized: Record<string, OptimizedDepInfo>;
  /**
   * Metadata for non-entry optimized chunks and dynamic imports
   */
  chunks: Record<string, OptimizedDepInfo>;
  /**
   * Metadata for each newly discovered dependency after processing
   */
  discovered: Record<string, OptimizedDepInfo>;
  /**
   * OptimizedDepInfo list
   */
  depInfoList: OptimizedDepInfo[];
}

export interface DepsOptimizer {
  metadata: DepOptimizationMetadata;
  scanProcessing?: Promise<void>;
  registerMissingImport: (id: string, resolved: string) => OptimizedDepInfo;
  run: () => void;
  isOptimizedDepFile: (id: string) => boolean;
  isOptimizedDepUrl: (url: string) => boolean;
  getOptimizedDepId: (depInfo: OptimizedDepInfo) => string;
  delayDepsOptimizerUntil: (id: string, done: () => Promise<any>) => void;
  registerWorkersSource: (id: string) => void;
  resetRegisteredIds: () => void;
  ensureFirstRun: () => void;
  close: () => Promise<void>;
  options: DepOptimizationOptions;
}

export interface ResolveOptions {
  mainFields?: string[];
  /**
   * @deprecated In future, `mainFields` should be used instead.
   * @default true
   */
  browserField?: boolean;
  conditions?: string[];
  extensions?: string[];
  dedupe?: string[];
  preserveSymlinks?: boolean;
}

export interface InternalResolveOptions extends Required<ResolveOptions> {
  root: string;
  isBuild: boolean;
  isProduction: boolean;
  ssrConfig?: any;
  packageCache?: PackageCache;
  /**
   * src code mode also attempts the following:
   * - resolving /xxx as URLs
   * - resolving bare imports from optimized deps
   */
  asSrc?: boolean;
  tryIndex?: boolean;
  tryPrefix?: string;
  skipPackageJson?: boolean;
  preferRelative?: boolean;
  isRequire?: boolean;
  // #3040
  // when the importer is a ts module,
  // if the specifier requests a non-existent `.js/jsx/mjs/cjs` file,
  // should also try import from `.ts/tsx/mts/cts` source file as fallback.
  isFromTsImporter?: boolean;
  tryEsmOnly?: boolean;
  // True when resolving during the scan phase to discover dependencies
  scan?: boolean;
  // Appends ?__vite_skip_optimization to the resolved id if shouldn't be optimized
  ssrOptimizeCheck?: boolean;
  // Resolve using esbuild deps optimization
  getDepsOptimizer?: (ssr: boolean) => DepsOptimizer | undefined;
  shouldExternalize?: (id: string) => boolean | undefined;
}

export type InternalResolveOptionsWithOverrideConditions = InternalResolveOptions & {
  /**
   * @deprecated In future, `conditions` will work like this.
   * @internal
   */
  overrideConditions?: string[];
};

export function tryNodeResolve(
  id: string,
  importer: string | null | undefined,
  options: InternalResolveOptionsWithOverrideConditions,
  targetWeb: boolean,
  depsOptimizer?: DepsOptimizer,
  externalize?: boolean,
  allowLinkedExternal: boolean = true
): PartialResolvedId | undefined {
  console.log(id);
  const { root, dedupe, isBuild, preserveSymlinks, packageCache } = options;

  const possiblePkgIds: string[] = [];

  for (let prevSlashIndex = -1; ; ) {
    let slashIndex = id.indexOf('/', prevSlashIndex + 1);

    if (slashIndex < 0) {
      slashIndex = id.length;
    }

    const part = id.slice(prevSlashIndex + 1, (prevSlashIndex = slashIndex));

    if (!part) {
      break;
    }

    // Assume path parts with an extension are not package roots, except for the
    // first path part (since periods are sadly allowed in package names).
    // At the same time, skip the first path part if it begins with "@"
    // (since "@foo/bar" should be treated as the top-level path).
    if (possiblePkgIds.length ? path.extname(part) : part[0] === '@') {
      continue;
    }

    possiblePkgIds.push(id.slice(0, slashIndex));
  }

  let basedir: string;

  if (dedupe?.some(id => possiblePkgIds.includes(id))) {
    basedir = root;
  } else if (importer && path.isAbsolute(importer) && fs.existsSync(cleanUrl(importer))) {
    basedir = path.dirname(importer);
  } else {
    basedir = root;
  }

  let pkg: PackageData | undefined;
  let pkgId: string | undefined;
  let nearestPkg: PackageData | undefined;

  const rootPkgId = possiblePkgIds[0];
  const rootPkg = resolvePackageData(rootPkgId, basedir, preserveSymlinks, packageCache)!;

  const nearestPkgId = [...possiblePkgIds].reverse().find(pkgId => {
    nearestPkg = resolvePackageData(pkgId, basedir, preserveSymlinks, packageCache)!;
    return nearestPkg;
  })!;

  if (rootPkg?.data?.exports) {
    pkgId = rootPkgId;
    pkg = rootPkg;
  } else {
    pkgId = nearestPkgId;
    pkg = nearestPkg;
  }

  if (!pkg || !nearestPkg) {
    // if import can't be found, check if it's an optional peer dep.
    // if so, we can resolve to a special id that errors only when imported.
    if (
      basedir !== root && // root has no peer dep
      !isBuiltin(id) &&
      !id.includes('\0') &&
      bareImportRE.test(id)
    ) {
      // find package.json with `name` as main
      const mainPackageJson = lookupFile(basedir, ['package.json'], {
        predicate: content => !!JSON.parse(content).name
      });

      if (mainPackageJson) {
        const mainPkg = JSON.parse(mainPackageJson);

        if (mainPkg.peerDependencies?.[id] && mainPkg.peerDependenciesMeta?.[id]?.optional) {
          return {
            id: `${optionalPeerDepId}:${id}:${mainPkg.name}`
          };
        }
      }
    }
    return;
  }

  let resolveId = resolvePackageEntry;
  let unresolvedId = pkgId;
  const isDeepImport = unresolvedId !== id;

  if (isDeepImport) {
    resolveId = resolveDeepImport;
    unresolvedId = '.' + id.slice(pkgId.length);
  }
}
