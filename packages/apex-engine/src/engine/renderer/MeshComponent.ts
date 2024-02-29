import RAPIER from '@dimforge/rapier3d-compat';
import { BufferAttribute, BufferGeometry, CanvasTexture, FrontSide, type IBufferAttributeJSON, LineBasicMaterial, LineDashedMaterial, type Material, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshDistanceMaterial, MeshLambertMaterial, MeshMatcapMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshPhysicalMaterial, MeshStandardMaterial, MeshToonMaterial, PointsMaterial, RawShaderMaterial, ShaderMaterial, ShadowMaterial, Sphere, SpriteMaterial, Texture, Vector2, Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type ColliderProxy } from '../physics/Collider';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { type RigidBodyProxy } from '../physics/RigidBody';
import { type RenderWorker } from './RenderWorker';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

type GeometryData = Record<string, any> | undefined;

type MaterialData = Record<string, any> | undefined;

export class MeshComponentProxy extends SceneComponentProxy {
  public override sceneObject: Mesh;

  constructor(
    [geometryData, materialData]: [GeometryData, MaterialData] = [undefined, undefined],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([geometryData, materialData], tb, id, thread, renderer);

    this.sceneObject = new Mesh(...this.getMeshArgs(geometryData, materialData));
  }

  protected getMeshArgs(geometryData: GeometryData, materialData: MaterialData): [BufferGeometry | undefined, Material | undefined] {
    const args: [BufferGeometry | undefined, Material | undefined] = [undefined, undefined];

    if (geometryData) {
      const { attributes, boundingSphere, index, uuid } = geometryData;
      const { normal, position, uv } = attributes;
      const geometry = new BufferGeometry();

      geometry.uuid = uuid;
      geometry.setAttribute('position', createBufferAttribute({ ...position, type: position.type }));

      if (normal) geometry.setAttribute('normal', createBufferAttribute({ ...normal, type: normal.type }));
      if (uv) geometry.setAttribute('uv', createBufferAttribute({ ...uv, type: uv.type }));

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
        let texture = this.renderer.getTexture(aoMap.uuid);

        if (!texture) {

        }

        // if (bitmap) {
        //   const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = aoMap;
        //   params.aoMap = new Texture(bitmap, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
        //   params.aoMap.uuid = aoMap.uuid;
        // }
      }

      if (map) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy } = map;
        params.map = new CanvasTexture(map.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
        params.map.uuid = map.uuid;
      }

      if (metalnessMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = metalnessMap;
        params.metalnessMap = new Texture(metalnessMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
        params.metalnessMap.uuid = metalnessMap.uuid;
      }

      if (normalMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy } = normalMap;
        params.normalMap = new CanvasTexture(normalMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
        params.normalMap.uuid = normalMap.uuid;
      }

      if (roughnessMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = roughnessMap;
        params.roughnessMap = new Texture(roughnessMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
        params.roughnessMap.uuid = roughnessMap.uuid;
      }

      args[1] = new materialConstructors[type as keyof typeof materialConstructors](params);
    }

    return args;
  }
}

type AnyMaterial = LineBasicMaterial
  | LineDashedMaterial
  | MeshBasicMaterial
  | MeshDepthMaterial
  | MeshDistanceMaterial
  | MeshLambertMaterial
  | MeshMatcapMaterial
  | MeshNormalMaterial
  | MeshPhongMaterial
  | MeshPhysicalMaterial
  | MeshStandardMaterial
  | MeshToonMaterial
  | PointsMaterial
  | RawShaderMaterial
  | ShaderMaterial
  | ShadowMaterial
  | SpriteMaterial;

@CLASS(proxy(EProxyThread.Render, MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  protected override bodyType: RAPIER.RigidBodyType | null = RAPIER.RigidBodyType.Fixed;

  constructor(
    public geometry: BufferGeometry | undefined = undefined,
    public material: Material | Material[] | undefined = undefined,
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger,
    @IPhysicsWorkerContext physicsContext: IPhysicsWorkerContext
  ) {
    super(instantiationService, logger, physicsContext);

    this.colliderShape = RAPIER.ShapeType.TriMesh;
    // this.renderContext.addTransferableSource(material.aoMap.source)
  }

  public override async beginPlay(): Promise<void> {
    // When resolved, the rigid-body is available and we can register the collider
    if (this.bodyType !== null) {
      await this.physicsContext.registerRigidBody(this, { position: this.position });
    }
    await this.physicsContext.registerCollider(this);
  }

  public override serializeArgs([geometry, material]: [BufferGeometry, any]): any[] {
    const { metadata, ...geometryData } = geometry.toJSON() as any;
    const materialData: Record<string, any> = {};

    if (material) {
      materialData.uuid = material.uuid;
      materialData.type = material.type;

      function serializeTexture({ anisotropy, center, channel, colorSpace, flipY, format, generateMipmaps, image, magFilter, mapping, minFilter, name, offset, premultiplyAlpha, repeat, rotation, source, type, unpackAlignment, userData, uuid, wrapS, wrapT }: Texture): any {
        return { anisotropy, center, channel, colorSpace, flipY, format, generateMipmaps, image, magFilter, mapping, minFilter, name, offset, premultiplyAlpha, repeat, rotation, source: source.uuid, type, unpackAlignment, userData, uuid, wrap: [wrapS, wrapT] };
      }

      if (material.aoMap && material.aoMap.isTexture) materialData.aoMap = serializeTexture(material.aoMap);
      if (material.aoMapIntensity) materialData.aoMapIntensity = material.aoMapIntensity;
      if (material.blendColor && material.blendColor.isColor) materialData.blendColor = material.blendColor.getHex();
      if (material.blendAlpha !== 0) materialData.blendAlpha = material.blendAlpha;
      if (material.name !== '') materialData.name = material.name;
      if (material.color && material.color.isColor) materialData.color = material.color.getHex();
      if (material.side !== FrontSide) materialData.side = material.side;
      if (material.emissive && material.emissive.isColor) materialData.emissive = material.emissive.getHex();
      if (material.emissiveIntensity && material.emissiveIntensity !== 1) materialData.emissiveIntensity = material.emissiveIntensity;
      if (material.roughnessMap && material.roughnessMap.isTexture) materialData.roughnessMap = serializeTexture(material.roughnessMap);
      if (material.metalnessMap && material.metalnessMap.isTexture) materialData.metalnessMap = serializeTexture(material.metalnessMap);
      if (material.map && material.map.isTexture) materialData.map = serializeTexture(material.map);

      if (material.normalMap && material.normalMap.isTexture) {
        materialData.normalMap = serializeTexture(material.normalMap);
        materialData.normalMapType = material.normalMapType;
        materialData.normalScale = material.normalScale.toArray();
      }
    }

    return [{ ...geometryData.data, uuid: geometryData.uuid }, materialData];
  }
}

export function createBufferAttribute({ type, array, itemSize, normalized }: IBufferAttributeJSON): BufferAttribute {
  const ArrayConstructor = Array.TYPED_ARRAY_CONSTRUCTORS[type];

  if (Array.isBigInt64Array(ArrayConstructor) || Array.isBigUint64Array(ArrayConstructor)) {
    throw new Error(`Cannot use BigInt arrays.`);
  }

  return new BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
}
