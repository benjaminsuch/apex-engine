import * as THREE from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { mat4, ref, serialize, string } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { GameProxyManager } from '../GameProxyManager';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';
import { type RenderWorker } from './RenderWorker';
import { type SceneComponent, type SceneComponentProxyArgs } from './SceneComponent';
import { Skeleton, type SkeletonProxy } from './Skeleton';

export class SkinnedMeshComponentProxy extends MeshComponentProxy {
  declare skeleton: SkeletonProxy;

  declare bindMatrix: Matrix4AsArray;

  declare bindMatrixInverse: Matrix4AsArray;

  declare bindMode: THREE.BindMode;

  public override readonly object: THREE.SkinnedMesh;

  constructor([params]: [SceneComponentProxyArgs], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([params], tb, id, thread, renderer);

    const geometry = this.geometry.get();

    this.object = new THREE.SkinnedMesh(geometry, this.material.get());

    if (params) {
      this.object.name = params.name;
      this.object.uuid = params.uuid || this.object.uuid;
    }

    this.object.bind(this.skeleton.get(), new THREE.Matrix4());
  }

  public override tick(context: IEngineLoopTickContext): void {
    super.tick(context);

    this.object.bindMode = this.bindMode;
    this.object.bindMatrix.fromArray(this.bindMatrix);
    this.object.bindMatrixInverse.fromArray(this.bindMatrixInverse);
  }
}

@CLASS(proxy(EProxyThread.Render, SkinnedMeshComponentProxy))
export class SkinnedMeshComponent extends MeshComponent {
  @PROP(serialize(ref(true)))
  public skeleton: Skeleton | null = null;

  @PROP(serialize(mat4))
  public bindMatrix: THREE.Matrix4 = new THREE.Matrix4();

  @PROP(serialize(mat4))
  public bindMatrixInverse: THREE.Matrix4 = new THREE.Matrix4();

  @PROP(serialize(string, 8))
  public bindMode: THREE.BindMode = 'attached';

  public normalizeSkinWeights(): void {
    const vector = new THREE.Vector4();
    const skinWeight = this.geometry.attributes.skinWeight as THREE.BufferAttribute;

    for (let i = 0, l = skinWeight.count; i < l; i++) {
      vector.fromBufferAttribute(skinWeight, i);

      const scale = 1.0 / vector.manhattanLength();

      if (scale !== Infinity) {
        vector.multiplyScalar(scale);
      } else {
        vector.set(1, 0, 0, 0);
      }

      skinWeight.setXYZW(i, vector.x, vector.y, vector.z, vector.w);
    }
  }

  public override copyFromObject3D(mesh: THREE.SkinnedMesh): void {
    super.copyFromObject3D(mesh);

    this.bindMatrix = mesh.bindMatrix;
    this.bindMatrixInverse = mesh.bindMatrixInverse;

    if (mesh.skeleton) {
      const bonesUuid = mesh.skeleton.bones.map(({ uuid }) => uuid);
      const bones: SceneComponent[] = [];

      for (const origin of GameProxyManager.getInstance().origins) {
        const component = origin as SceneComponent;

        if (bonesUuid.includes(component.uuid)) {
          bones.push(component);
        }
      }

      this.skeleton = this.instantiationService.createInstance(Skeleton, bones, mesh.skeleton.boneInverses);
    }
  }
}
