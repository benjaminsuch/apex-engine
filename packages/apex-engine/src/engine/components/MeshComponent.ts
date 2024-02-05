import RAPIER from '@dimforge/rapier3d-compat';
import { Box3, Box3Helper, BufferAttribute, BufferGeometry, type IBufferAttributeJSON, type IGeometryData, type IMaterialJSON, type Material, Mesh, MeshStandardMaterial, ObjectLoader, Sphere, Vector2, Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { type RenderWorker } from '../renderer/RenderWorker';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';
//
export class MeshComponentProxy extends SceneComponentProxy {
  private readonly box3Helper: Box3Helper;

  public readonly box3: Box3;

  public override sceneObject: Mesh;

  constructor(
    [geometryData, materialData]: [IGeometryData | undefined, IMaterialJSON | undefined] = [undefined, undefined],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([geometryData, materialData], tb, id, thread, renderer);

    this.box3 = new Box3();
    this.box3Helper = new Box3Helper(this.box3, 0xffff00);
    renderer.addSceneObject(this.box3Helper);

    const args: [BufferGeometry | undefined, Material | undefined] = [undefined, undefined];

    if (geometryData) {
      const { attributes, boundingSphere, index, uuid } = geometryData;
      const { normal, position, uv } = attributes;
      const geometry = new BufferGeometry();
      geometry.uuid = uuid;

      geometry.setAttribute('position', createBufferAttribute({ ...position, type: position.array.constructor.name }));
      geometry.setAttribute('normal', createBufferAttribute({ ...normal, type: normal.array.constructor.name }));
      geometry.setAttribute('uv', createBufferAttribute({ ...uv, type: uv.array.constructor.name }));
      geometry.setIndex(createBufferAttribute({ ...index, normalized: false, itemSize: 1, type: 'Uint16Array' }));

      if (boundingSphere) {
        geometry.boundingSphere = new Sphere(new Vector3().fromArray(boundingSphere.center), boundingSphere.radius);
      }

      args[0] = geometry;
      geometry.computeBoundingBox();
    }

    if (materialData) {
      let { aoMap, map, metalnessMap, normalMap, normalScale, roughnessMap, type, ...params } = materialData;

      if (type === 'MeshStandardMaterial') {
        let material: any;
        const loader = new ObjectLoader();
        const t = [
          aoMap ? { ...aoMap, image: aoMap.source.uuid } : undefined,
          map ? { ...map, image: map.source.uuid } : undefined,
          metalnessMap ? { ...metalnessMap, image: metalnessMap.source.uuid } : undefined,
          normalMap ? { ...normalMap, image: normalMap.source.uuid } : undefined,
          roughnessMap ? { ...roughnessMap, image: roughnessMap.source.uuid } : undefined,
        ].filter(Boolean);
        const sourceMaps = {
          ...(aoMap ? { [aoMap.source.uuid]: aoMap.source } : undefined),
          ...(map ? { [map.source.uuid]: map.source } : undefined),
          ...(metalnessMap ? { [metalnessMap.source.uuid]: metalnessMap.source } : undefined),
          ...(normalMap ? { [normalMap.source.uuid]: normalMap.source } : undefined),
          ...(roughnessMap ? { [roughnessMap.source.uuid]: roughnessMap.source } : undefined),
        };
        console.log(t, sourceMaps);
        const textures = loader.parseTextures(
          t,
          sourceMaps
        );
        console.log(textures);
        if (Object.keys(textures).length > 0) {
          const materials = loader.parseMaterials([{
            ...materialData,
            aoMap: aoMap?.uuid ?? undefined,
            map: map?.uuid ?? undefined,
            metalnessMap: metalnessMap?.uuid ?? undefined,
            normalMap: normalMap?.uuid ?? undefined,
            roughnessMap: roughnessMap?.uuid ?? undefined,
          }], textures);
          console.log(materials);
          material = materials[materialData.uuid];
        } else {
          material = new MeshStandardMaterial({
            ...params,
            normalScale: new Vector2(normalScale.x, normalScale.y),
          });
        }

        args[1] = material;
      }
    }

    this.sceneObject = new Mesh(...args);
  }

  public override tick(tick: IEngineLoopTickContext): void {
    super.tick(tick);
    this.box3.copy(this.sceneObject.geometry.boundingBox!).applyMatrix4(this.sceneObject.matrixWorld);
  }
}

@CLASS(proxy(EProxyThread.Render, MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  constructor(
    public geometry: BufferGeometry | undefined = undefined,
    public material: Material | undefined = undefined,
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger,
    @IPhysicsWorkerContext physicsContext: IPhysicsWorkerContext
  ) {
    super(instantiationService, logger, physicsContext);

    this.colliderShape = RAPIER.ShapeType.TriMesh;
  }

  public override async beginPlay(): Promise<void> {
    // When resolved, the rigid-body is available and we can register the collider
    await super.beginPlay();
    await this.physicsContext.registerCollider(this);
  }
}

const TYPED_ARRAYS = {
  Uint16Array,
  Int16Array,
  Uint8Array,
  Int8Array,
  Int32Array,
  Uint32Array,
  Float32Array,
} as const;

function createBufferAttribute({ type, array, itemSize, normalized }: IBufferAttributeJSON): BufferAttribute {
  const ArrayConstructor = TYPED_ARRAYS[type as keyof typeof TYPED_ARRAYS];

  if (ArrayConstructor) {
    return new BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
  }

  throw new Error(`Unknown array type.`);
}
