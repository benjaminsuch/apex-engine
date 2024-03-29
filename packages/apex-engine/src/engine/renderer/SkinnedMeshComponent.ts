import { Matrix4, type SkinnedMesh } from 'three';

import { CLASS, getTargetId, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { mat4, ref, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { GameProxyManager } from '../GameProxyManager';
import { type ProxyInstance } from '../ProxyInstance';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';
import { type RenderWorker } from './RenderWorker';
import { type SceneComponent } from './SceneComponent';
import { Skeleton, type SkeletonProxy } from './Skeleton';

export class SkinnedMeshComponentProxy extends MeshComponentProxy {
  declare skeleton: SkeletonProxy;

  declare bindMatrix: Matrix4AsArray;

  declare bindMatrixInverse: Matrix4AsArray;

  // public override sceneObject: SkinnedMesh;

  constructor(args: [], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([], tb, id, thread, renderer);
  }
}

@CLASS(proxy(EProxyThread.Render, SkinnedMeshComponentProxy))
export class SkinnedMeshComponent extends MeshComponent {
  @PROP(serialize(ref(true)))
  public skeleton: Skeleton | null = null;

  @PROP(serialize(mat4))
  public bindMatrix: Matrix4 = new Matrix4();

  @PROP(serialize(mat4))
  public bindMatrixInverse: Matrix4 = new Matrix4();

  public override copyFromObject3D(mesh: SkinnedMesh): void {
    super.copyFromObject3D(mesh);

    this.bindMatrix = mesh.bindMatrix;
    this.bindMatrixInverse = mesh.bindMatrixInverse;

    if (mesh.skeleton) {
      const bonesUuid = mesh.skeleton.bones.map(({ uuid }) => uuid);
      const bones: ProxyInstance['id'][] = [];

      for (const origin of GameProxyManager.getInstance().origins) {
        const sceneComponent = origin as SceneComponent;

        if (bonesUuid.includes(sceneComponent.uuid)) {
          bones.push(getTargetId(sceneComponent) as number);
        }
      }

      this.skeleton = this.instantiationService.createInstance(Skeleton, bones, mesh.skeleton.boneInverses.map(m => m.toArray()).flat());
    }
  }
}
