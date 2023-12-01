import * as THREE from 'three';

import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';

export class SkinnedMeshComponentProxy extends MeshComponentProxy {
  public override sceneObject: THREE.SkinnedMesh = new THREE.SkinnedMesh();
}

@CLASS(proxy(SkinnedMeshComponentProxy))
export class SkinnedMeshComponent extends MeshComponent {}
