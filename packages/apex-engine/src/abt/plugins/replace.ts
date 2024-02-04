import { posix } from 'node:path';

import replace from '@rollup/plugin-replace';
import { type Plugin } from 'rollup';

import { type TargetConfig } from '../config';

export function replacePlugin(target: TargetConfig): Plugin<any> {
  const DEFAULT_MAP = JSON.stringify(target.defaultMap);
  // @todo: I need a better solution for this. I don't want default values hardcoded in here.
  const DEFAULT_PAWN = JSON.stringify(target.defaultPawn ? posix.join('game', target.defaultPawn) : './DefaultPawn');
  const DEFAULT_GAME_MODE = JSON.stringify(target.defaultGameMode ? posix.join('game', target.defaultGameMode) : './GameMode');

  return replace({
    preventAssignment: true,
    values: {
      DEFAULT_MAP,
      DEFAULT_PAWN,
      DEFAULT_GAME_MODE,
      IS_DEV: 'true',
      IS_CLIENT: String(target.target === 'client'),
      IS_GAME: String(target.target === 'game'),
      IS_SERVER: String(target.target === 'server'),
      IS_BROWSER: String(target.platform === 'browser'),
      IS_NODE: String(target.platform === 'node'),
      IS_WORKER: 'typeof window === \'undefined\'',
    },
  });
}
