import { extname, relative } from 'node:path';

import virtual from '@rollup/plugin-virtual';
import fs from 'fs-extra';
import { type Plugin } from 'rollup';

import { ENGINE_PATH, type TargetConfig } from '../config';

export function buildInfo(target: TargetConfig, levels: [string, string][] = []): Plugin<any> {
  return virtual({
    'build:info': [
      // #region Plugins
      'export const plugins = new Map();',
      '',
      ...target.plugins.map(id => `plugins.set('${id}', await import('${id}'));`),
      // #endregion
      // #region Levels
      'const levels = {',
      ...buildLevels(levels),
      '};',
      '',
      'export async function loadLevel(url) {',
      '  return levels[url]()',
      '}',
      // #endregion
    ].join('\n'),
  });
}

/**
 * To make sure all levels are included in the bundle I create an object with
 * the relative path as a key and an import-function as a value.
 *
 * When calling `ApexEngine.loadMap` and you pass the levels relative path, it
 * will automatically load the respective level.
 */
function buildLevels(levels: [string, string][]): string[] {
  // `p2` is the absolute path to the file. We remove the original file
  // extension and add ".ts".
  function rename([p1, p2]: [string, string]): [string, string] {
    return [p1, `${p2.slice(0, p2.length - extname(p2).length)}.ts`];
  }

  function normalizedRelative(p1: string, p2: string): string {
    return relative(p1, p2).replaceAll('\\', '/');
  }

  function createImport([p1, p2]: [string, string]): string {
    return `  '${normalizedRelative('game/maps', p1)}': async () => import('${normalizedRelative(ENGINE_PATH, p2)}'),`;
  }

  return levels
    .map(rename)
    .filter(([, p2]) => fs.existsSync(p2))
    .map(createImport);
}
