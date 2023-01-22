import type { ReadableStream as TNodeReadableStream } from 'node:stream/web';

const MyReadableStream = IS_SERVER
  ? (await import('node:stream/web')).ReadableStream
  : window.ReadableStream;

export const NodeReadableStream = MyReadableStream as typeof TNodeReadableStream;

export const WebReadableStream = MyReadableStream as typeof window.ReadableStream;
