import * as THREE from 'three';

import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { RenderProxy } from './RenderProxy';
import { type RenderWorker } from './RenderWorker';
import { SceneComponent } from './SceneComponent';

export class BoneProxy extends RenderProxy<THREE.Bone> {
  protected readonly object: THREE.Bone;

  constructor([]: [] = [], tb: TripleBuffer, id: number, originThread: EProxyThread, renderer: RenderWorker) {
    super([], tb, id, originThread, renderer);

    this.object = new THREE.Bone();
  }
}

@CLASS(proxy(EProxyThread.Render, BoneProxy))
export class Bone extends SceneComponent {}
