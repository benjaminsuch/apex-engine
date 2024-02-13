import { Matrix4 } from 'three';

import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type ProxyInstance } from '../ProxyInstance';
import { RenderProxy } from './RenderProxy';
import { type RenderWorker } from './RenderWorker';
import { type SceneComponentProxy } from './SceneComponent';

export class SkeletonProxy extends RenderProxy {
  public readonly bones: SceneComponentProxy[] = [];

  public readonly boneInverses: Matrix4[] = [];

  constructor(
    [bones, boneInverses]: [RenderProxy['id'][], number[]] = [[], []],
    tb: TripleBuffer,
    id: number,
    originThread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([bones, boneInverses], tb, id, originThread, renderer);

    for (const boneId of bones) {
      const proxy = this.renderer.proxyManager.getProxy<SceneComponentProxy>(boneId, EProxyThread.Game);

      if (proxy) {
        this.bones.push(proxy.target);
      }
    }

    if (boneInverses.length % 16 !== 0) {
      throw new Error(`Invalid length: Bone inverses must be dividable by 16.`);
    }

    while (boneInverses.length > 0) {
      this.boneInverses.push(new Matrix4().fromArray(boneInverses.splice(0, 16)));
    }
  }
}

@CLASS(proxy(EProxyThread.Render, SkeletonProxy))
export class Skeleton {
  constructor(public readonly bones: ProxyInstance['id'][], public readonly boneInverses: number[]) {}
}
