import virtual from '@rollup/plugin-virtual';

import { type TargetConfig } from '../config';

export function buildInfo(target: TargetConfig) {
  return virtual({
    'build:info': [
      'export const plugins = new Map()',
      '',
      ...target.plugins.map(id => `plugins.set('${id}', await import('${id}'))`),
    ].join('\n'),
  });
}
