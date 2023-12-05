import * as THREE from 'three';

import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class BoneComponentProxy extends SceneComponentProxy {
  public override sceneObject: THREE.Bone = new THREE.Bone();
}

@CLASS(proxy(BoneComponentProxy))
export class BoneComponent extends SceneComponent {}
