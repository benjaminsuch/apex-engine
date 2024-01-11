import { extname, relative } from 'node:path';

import virtual from '@rollup/plugin-virtual';
import fs from 'fs-extra';
import { type Plugin } from 'rollup';

import { ENGINE_PATH, type TargetConfig } from '../config';

export function buildInfo(target: TargetConfig, levels: string[][] = []): Plugin<any> {
  // console.log('levels', levels);
  const virt = {
    'build:info': [
      // Plugins
      'export const plugins = new Map();',
      '',
      ...target.plugins.map(id => `plugins.set('${id}', await import('${id}'));`),
      // Levels
      'export const levels = {',
      ...levels
        .map(([p1, p2]) => [p1, `${p2.slice(0, p2.length - extname(p2).length)}.ts`])
        .filter(([, p2]) => fs.existsSync(p2))
        .map(([p1, p2]) => `  '${relative('game/maps', p1).replaceAll('\\', '/')}': async () => import('${relative(
          ENGINE_PATH,
          p2
        ).replaceAll('\\', '/')}'),`),
      '};',
    ].join('\n'),
  };
  console.log('virt', virt);
  return virtual(virt);
}
