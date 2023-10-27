import { TripleBuffer } from '../platform/memory/common';
import { type TTripleBufferData } from '../platform/renderer/common';
import { type SceneProxy } from './SceneProxy';
import { originProxyMap } from './proxy.config';

export function constructProxy(
  origin: string,
  id: number,
  { buffers, byteLength, flags }: TTripleBufferData
) {
  const Constructor: typeof SceneProxy | undefined = originProxyMap.get(origin);

  if (!Constructor) {
    throw new Error(`No constructor found for "${origin}".`);
  }

  return new Constructor(origin, id, new TripleBuffer(flags, byteLength, buffers));
}
