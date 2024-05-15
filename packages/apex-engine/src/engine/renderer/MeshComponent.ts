import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { ref, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { type BufferGeometry, type BufferGeometryProxy } from './geometries/BufferGeometry';
import { type Material, type MaterialProxy } from './materials/Material';
import { type RenderWorker } from './RenderWorker';
import { IRenderWorkerContext } from './RenderWorkerContext';
import { SceneComponent, SceneComponentProxy, type SceneComponentProxyArgs } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy<THREE.Mesh> {
  declare geometry: BufferGeometryProxy;

  declare material: MaterialProxy;

  protected override readonly object: THREE.Mesh;

  constructor([params]: [SceneComponentProxyArgs], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([], tb, id, thread, renderer);

    this.object = new THREE.Mesh(this.geometry.get(), this.material.get());

    if (params) {
      this.object.name = params.name;
      this.object.uuid = params.uuid || this.object.uuid;
    }
  }
}

@CLASS(proxy(EProxyThread.Render, MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  protected override bodyType: RAPIER.RigidBodyType | null = RAPIER.RigidBodyType.Fixed;

  @PROP(serialize(ref(true)))
  public geometry: BufferGeometry;

  @PROP(serialize(ref))
  public material: Material | null;

  public type: string = '';

  constructor(
    geometry: MeshComponent['geometry'],
    material: MeshComponent['material'],
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger,
    @IPhysicsWorkerContext physicsContext: IPhysicsWorkerContext,
    @IRenderWorkerContext renderContext: IRenderWorkerContext
  ) {
    super(instantiationService, logger, physicsContext, renderContext);

    this.geometry = geometry;
    this.material = material;
    this.colliderShape = RAPIER.ShapeType.TriMesh;
  }

  public override async beginPlay(): Promise<void> {
    // When resolved, the rigid-body is available and we can register the collider
    if (this.bodyType !== null) {
      await this.physicsContext.registerRigidBody(this, { position: this.position });
    }
    await this.physicsContext.registerCollider(this);
  }
}
