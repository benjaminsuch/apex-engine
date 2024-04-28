import * as THREE from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { mat4, ref, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { GameProxyManager } from '../GameProxyManager';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';
import { type RenderWorker } from './RenderWorker';
import { IRenderWorkerContext } from './RenderWorkerContext';
import { type SceneComponent } from './SceneComponent';
import { Skeleton, type SkeletonProxy } from './Skeleton';

export class SkinnedMeshComponentProxy extends MeshComponentProxy {
  declare skeleton: SkeletonProxy;

  declare bindMatrix: Matrix4AsArray;

  declare bindMatrixInverse: Matrix4AsArray;

  public override readonly object: THREE.SkinnedMesh;

  constructor([params]: any[], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([], tb, id, thread, renderer);
    console.log('skinned mesh proxy', this);
    const geometry = this.geometry.get();

    this.object = new THREE.SkinnedMesh(geometry, this.material.get());

    if (params) {
      this.object.name = params.name;
      this.object.uuid = params.uuid || this.object.uuid;
    }

    this.object.bind(this.skeleton.get());
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

  constructor(
    geometry: MeshComponent['geometry'],
    material: MeshComponent['material'],
  @IInstantiationService instantiationService: IInstantiationService,
  @IConsoleLogger logger: IConsoleLogger,
  @IPhysicsWorkerContext physicsContext: IPhysicsWorkerContext,
  @IRenderWorkerContext renderContext: IRenderWorkerContext
  ) {
    super(geometry, material, instantiationService, logger, physicsContext, renderContext);

    console.log('SkinnedMesh', this);
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
