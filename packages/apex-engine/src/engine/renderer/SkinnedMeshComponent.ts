import { type Object3D, SkinnedMesh } from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { ref, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';
import { type RenderWorker } from './RenderWorker';
import { Skeleton } from './Skeleton';

export class SkinnedMeshComponentProxy extends MeshComponentProxy {
  // public override sceneObject: SkinnedMesh;
  declare skeleton: any;

  constructor(
    [geometryData, materialData]: [Record<string, any> | undefined, Record<string, any> | undefined] = [undefined, undefined],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([geometryData, materialData], tb, id, thread, renderer);
    setTimeout(() => {
      console.log('skinnedmesh', this);
    }, 3000);
    // this.sceneObject = new SkinnedMesh(...this.getMeshArgs(geometryData, materialData));
  }
}

@CLASS(proxy(EProxyThread.Render, SkinnedMeshComponentProxy))
export class SkinnedMeshComponent extends MeshComponent {
  @PROP(serialize(ref))
  public skeleton: Skeleton | null = null;

  public override copyFromObject3D(obj: Object3D | SkinnedMesh): void {
    super.copyFromObject3D(obj);

    if (obj instanceof SkinnedMesh) {
      if (obj.skeleton) {
        this.skeleton = this.instantiationService.createInstance(Skeleton, obj.skeleton.bones.map(({ uuid }) => uuid));
      }
    }
  }
}
