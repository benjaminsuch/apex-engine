import RAPIER from '@dimforge/rapier3d-compat';
import { Box3, Box3Helper, BufferAttribute, BufferGeometry, CanvasTexture, type DataTexture, type IBufferAttributeJSON, type IGeometryData, type IMaterialJSON, type Material, Mesh, MeshStandardMaterial, ObjectLoader, Sphere, Texture, UnsignedByteType, Vector2, Vector3 } from 'three';

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
        if (aoMap) {
          if (aoMap.type === UnsignedByteType) {
            const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = aoMap;
            aoMap = new Texture(aoMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
          }
        }
        if (map) {
          const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy } = map;
          map = new CanvasTexture(map.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
        }
        if (metalnessMap) {
          const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = metalnessMap;
          metalnessMap = new Texture(metalnessMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
        }
        if (normalMap) {
          const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy } = normalMap;
          normalMap = new CanvasTexture(normalMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
        }
        if (roughnessMap) {
          const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = roughnessMap;
          roughnessMap = new Texture(roughnessMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
        }

        args[1] = new MeshStandardMaterial({
          ...params,
          aoMap: aoMap ? aoMap as Texture : null,
          map: map ? map as Texture : null,
          metalnessMap: metalnessMap ? metalnessMap as Texture : null,
          normalMap: normalMap ? normalMap as Texture : null,
          roughnessMap: roughnessMap ? roughnessMap as Texture : null,
          normalScale: new Vector2(normalScale.x, normalScale.y),
        });
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
