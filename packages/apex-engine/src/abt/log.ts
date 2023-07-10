export let isDebugModeOn = false;

export const debug = (...args: Parameters<typeof console.debug>) =>
  isDebugModeOn && console.debug('DEBUG', ...args);
