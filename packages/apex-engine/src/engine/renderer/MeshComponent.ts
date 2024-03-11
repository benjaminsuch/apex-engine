import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { ref, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { type BufferGeometry } from './BufferGeometry';
import { type Material } from './materials/Material';
import { MeshStandardMaterial } from './materials/MeshStandardMaterial';
import { type RenderWorker } from './RenderWorker';
import { IRenderWorkerContext } from './RenderWorkerContext';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';
import { Texture } from './textures/Texture';

interface CapsuleGeometryJSON {
  capSegments: number;
  length: number;
  radiusSegments: number;
  radius: number;
  type: 'CapsuleGeometry';
}

type GeometryData = CapsuleGeometryJSON | undefined;

type MaterialData = Record<string, any> | undefined;

export class MeshComponentProxy extends SceneComponentProxy {
  // public override sceneObject: THREE.Mesh;

  constructor(
    args: never[],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super(args, tb, id, thread, renderer);
  }
}

@CLASS(proxy(EProxyThread.Render, MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  protected override bodyType: RAPIER.RigidBodyType | null = RAPIER.RigidBodyType.Fixed;

  @PROP(serialize(ref(true)))
  public geometry: BufferGeometry;

  @PROP(serialize(ref(true)))
  public material: Material;

  public type: string = '';

  constructor(
    geometry: BufferGeometry,
    material: Material,
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

export function createBufferAttribute({ type, array, itemSize, normalized }: THREE.IBufferAttributeJSON): THREE.BufferAttribute {
  const ArrayConstructor = Array.TYPED_ARRAY_CONSTRUCTORS[type];

  if (Array.isBigInt64Array(ArrayConstructor) || Array.isBigUint64Array(ArrayConstructor)) {
    throw new Error(`Cannot use BigInt arrays.`);
  }

  return new THREE.BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
}
