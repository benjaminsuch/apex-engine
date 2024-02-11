import { type BufferGeometry, type Material, Matrix4, type Object3D, Skeleton as ThreeSkeleton, SkinnedMesh } from 'three';

import { CLASS, getTargetId, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { mat4, ref, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { GameProxyManager } from '../GameProxyManager';
import { type ProxyInstance } from '../ProxyInstance';
import { createBufferAttribute, MeshComponent, MeshComponentProxy } from './MeshComponent';
import { type RenderWorker } from './RenderWorker';
import { type Matrix4AsArray, type SceneComponent } from './SceneComponent';
import { Skeleton } from './Skeleton';

export class SkinnedMeshComponentProxy extends MeshComponentProxy {
  declare skeleton: any;

  declare bindMatrix: Matrix4AsArray;

  declare bindMatrixInverse: Matrix4AsArray;

  public override sceneObject: SkinnedMesh;

  constructor(
    [geometryData, materialData]: [Record<string, any> | undefined, Record<string, any> | undefined] = [undefined, undefined],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([geometryData, materialData], tb, id, thread, renderer);
    // console.log('skinnedmesh skeleton', this, this.bindMatrix, this.bindMatrixInverse);
    this.sceneObject = new SkinnedMesh(...this.getMeshArgs(geometryData, materialData));
    console.log('skeleton', id, this.skeleton);
    this.sceneObject.bind(new ThreeSkeleton());
  }

  protected override getMeshArgs(geometryData: Record<string, any> | undefined, materialData: Record<string, any> | undefined): [BufferGeometry | undefined, Material | undefined] {
    const [geometry, material] = super.getMeshArgs(geometryData, materialData);

    if (geometry) {
      const { skinIndex, skinWeight } = geometryData!.attributes;

      geometry.setAttribute('skinIndex', createBufferAttribute({ ...skinIndex, type: skinIndex.array.constructor.name }));
      geometry.setAttribute('skinWeight', createBufferAttribute({ ...skinWeight, type: skinWeight.array.constructor.name }));
    }

    return [geometry, material];
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

  public override copyFromObject3D(obj: Object3D | SkinnedMesh): void {
    super.copyFromObject3D(obj);

    if (obj instanceof SkinnedMesh) {
      this.bindMatrix = obj.bindMatrix;
      this.bindMatrixInverse = obj.bindMatrixInverse;

      if (obj.skeleton) {
        const bonesUuid = obj.skeleton.bones.map(({ uuid }) => uuid);
        const bones: ProxyInstance['id'][] = [];

        for (const proxy of GameProxyManager.getInstance().proxies) {
          const target = proxy.target as SceneComponent;

          if (bonesUuid.includes(target.uuid)) {
            bones.push(getTargetId(target) as number);
          }
        }

        this.skeleton = this.instantiationService.createInstance(Skeleton, bones);
      }
    }
  }
}
