import RAPIER from '@dimforge/rapier3d-compat';
import { BufferAttribute, BufferGeometry, CanvasTexture, type IBufferAttributeJSON, LineBasicMaterial, LineDashedMaterial, type Material, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshDistanceMaterial, MeshLambertMaterial, MeshMatcapMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshPhysicalMaterial, MeshStandardMaterial, MeshToonMaterial, PointsMaterial, RawShaderMaterial, ShaderMaterial, ShadowMaterial, Sphere, SpriteMaterial, Texture, Vector2, Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { type RenderWorker } from '../renderer/RenderWorker';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy {
  public override sceneObject: Mesh;

  constructor(
    [geometryData, materialData]: [Record<string, any> | undefined, Record<string, any> | undefined] = [undefined, undefined],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([geometryData, materialData], tb, id, thread, renderer);

    const args: [BufferGeometry | undefined, Material | undefined] = [undefined, undefined];

    if (geometryData) {
      const { attributes, boundingSphere, index, uuid } = geometryData;
      const { normal, position, uv } = attributes;
      const geometry = new BufferGeometry();

      geometry.uuid = uuid;
      geometry.setAttribute('position', createBufferAttribute({ ...position, type: position.array.constructor.name }));

      if (normal) geometry.setAttribute('normal', createBufferAttribute({ ...normal, type: normal.array.constructor.name }));
      if (uv) geometry.setAttribute('uv', createBufferAttribute({ ...uv, type: uv.array.constructor.name }));

      geometry.setIndex(createBufferAttribute({ ...index, normalized: false, itemSize: 1, type: 'Uint16Array' }));

      if (boundingSphere) {
        geometry.boundingSphere = new Sphere(new Vector3().fromArray(boundingSphere.center), boundingSphere.radius);
      }

      args[0] = geometry;
    }

    if (materialData) {
      const materialConstructors = {
        LineBasicMaterial,
        LineDashedMaterial,
        MeshBasicMaterial,
        MeshDepthMaterial,
        MeshDistanceMaterial,
        MeshLambertMaterial,
        MeshMatcapMaterial,
        MeshNormalMaterial,
        MeshPhongMaterial,
        MeshPhysicalMaterial,
        MeshStandardMaterial,
        MeshToonMaterial,
        PointsMaterial,
        RawShaderMaterial,
        ShaderMaterial,
        ShadowMaterial,
        SpriteMaterial,
      } as const;

      let { aoMap, map, metalnessMap, normalMap, normalScale, roughnessMap, type, ...rest } = materialData;
      const params: Record<string, any> = rest;

      if (aoMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = aoMap;
        params.aoMap = new Texture(aoMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
      }

      if (map) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy } = map;
        params.map = new CanvasTexture(map.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
      }

      if (metalnessMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = metalnessMap;
        params.metalnessMap = new Texture(metalnessMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
      }

      if (normalMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy } = normalMap;
        params.normalMap = new CanvasTexture(normalMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
      }

      if (roughnessMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = roughnessMap;
        params.roughnessMap = new Texture(roughnessMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
      }

      args[1] = new materialConstructors[type as keyof typeof materialConstructors](params);
    }

    this.sceneObject = new Mesh(...args);
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

function createBufferAttribute({ type, array, itemSize, normalized }: IBufferAttributeJSON): BufferAttribute {
  const ArrayConstructor = Array.TYPED_ARRAY_CONSTRUCTORS[type];

  if (Array.isBigInt64Array(ArrayConstructor) || Array.isBigUint64Array(ArrayConstructor)) {
    throw new Error(`Cannot use BigInt arrays.`);
  }

  return new BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
}
