import replace from '@rollup/plugin-replace';
import { type Plugin } from 'rollup';

import { type TargetConfig } from '../config';

export function replacePlugin(target: TargetConfig): Plugin<any> {
  return replace({
    preventAssignment: true,
    values: {
      DEFAULT_MAP: JSON.stringify(target.defaultMap),
      IS_DEV: 'true',
      IS_CLIENT: String(target.target === 'client'),
      IS_GAME: String(target.target === 'game'),
      IS_SERVER: String(target.target === 'server'),
      IS_BROWSER: String(target.platform === 'browser'),
    },
  });
}
