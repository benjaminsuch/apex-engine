import * as THREE from 'three';

import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { RenderProxy } from './RenderProxy';
import { type RenderWorker } from './RenderWorker';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class BoneProxy extends SceneComponentProxy<THREE.Bone> {
  protected override readonly object: THREE.Bone;

  constructor([params]: any[] = [], tb: TripleBuffer, id: number, originThread: EProxyThread, renderer: RenderWorker) {
    super([params], tb, id, originThread, renderer);

    this.object = new THREE.Bone();

    if (params) {
      this.object.name = params.name;
      this.object.uuid = params.uuid || this.object.uuid;
    }
  }
}

@CLASS(proxy(EProxyThread.Render, BoneProxy))
export class Bone extends SceneComponent {}
