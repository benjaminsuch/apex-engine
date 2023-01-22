export const WritableStream = IS_SERVER
  ? (await import('node:stream/web')).WritableStream
  : window.WritableStream;
