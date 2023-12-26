import virtual from '@rollup/plugin-virtual';
import { type Plugin } from 'rollup';

import { type TargetConfig } from '../config';

export function buildInfo(target: TargetConfig): Plugin<any> {
  return virtual({
    'build:info': [
      'export const plugins = new Map()',
      '',
      ...target.plugins.map(id => `plugins.set('${id}', await import('${id}'))`),
    ].join('\n'),
  });
}
