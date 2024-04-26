import * as THREE from 'three';

import { CLASS, getTargetId } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { type BoneProxy } from './Bone';
import { RenderProxy } from './RenderProxy';
import { type RenderWorker } from './RenderWorker';
import { type SceneComponent } from './SceneComponent';

export class SkeletonProxy extends RenderProxy<THREE.Skeleton> {
  public readonly bones: BoneProxy[] = [];

  public readonly boneInverses: THREE.Matrix4[] = [];

  protected readonly object: THREE.Skeleton;

  constructor(
    [bones, boneInverses]: [RenderProxy['id'][], THREE.Matrix4Tuple[]] = [[], []],
    tb: TripleBuffer,
    id: number,
    originThread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([bones, boneInverses], tb, id, originThread, renderer);

    for (const boneId of bones) {
      const proxy = this.renderer.proxyManager.getProxy<BoneProxy>(boneId, EProxyThread.Game);

      if (proxy) {
        this.bones.push(proxy.target);
      }
    }

    let boneInverse: THREE.Matrix4Tuple | undefined;

    while (boneInverse = boneInverses.shift()) {
      this.boneInverses.push(new THREE.Matrix4().fromArray(boneInverse));
    }

    this.object = new THREE.Skeleton(this.bones.map(bone => bone.get()), this.boneInverses);
  }
}

@CLASS(proxy(EProxyThread.Render, SkeletonProxy))
export class Skeleton implements IProxyOrigin {
  declare readonly tripleBuffer: TripleBuffer;

  declare readonly byteView: Uint8Array;

  constructor(public readonly bones: SceneComponent[], public readonly boneInverses: THREE.Matrix4[]) {}

  public tick(context: IEngineLoopTickContext): void {}

  public getProxyArgs(): [number[], THREE.Matrix4Tuple[]] {
    return [
      this.bones.map(bone => getTargetId(bone) as number),
      this.boneInverses.map(inverse => inverse.toArray()),
    ];
  }
}
