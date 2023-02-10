/**
 * arts contain code from the Vite project:
 *
 * Repository: https://github.com/vitejs/vite/tree/main/packages/vite
 * License: https://github.com/vitejs/vite/blob/main/packages/vite/LICENSE.md
 *
 * MIT License
 *
 * Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors
 */

import { InlineConfig, resolveConfig } from '../config';

export interface ServerConfig extends InlineConfig {}

export async function createServer(inlineConfig: ServerConfig = {}) {
  const config = await resolveConfig(inlineConfig);
}
