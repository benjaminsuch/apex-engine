import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type ProxyInstance } from '../ProxyInstance';
import { RenderProxy } from './RenderProxy';
import { type RenderWorker } from './RenderWorker';

export class SkeletonProxy extends RenderProxy {
  public readonly bones: RenderProxy[] = [];

  constructor(
    [bones]: [RenderProxy['id'][]] = [[]],
    tb: TripleBuffer,
    id: number,
    originThread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([bones], tb, id, originThread, renderer);

    for (const boneId of bones) {
      const proxy = this.renderer.proxyManager.getProxy<RenderProxy>(boneId);

      if (proxy) {
        this.bones.push(proxy);
      }
    }
  }
}

@CLASS(proxy(EProxyThread.Render, SkeletonProxy))
export class Skeleton {
  constructor(public readonly bones: ProxyInstance['id'][]) {}
}
