import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { ref, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { BufferGeometry } from './BufferGeometry';
import { Material } from './materials/Material';
import { MeshStandardMaterial } from './materials/MeshStandardMaterial';
import { type RenderWorker } from './RenderWorker';
import { IRenderWorkerContext } from './RenderWorkerContext';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';
import { Texture } from './textures/Texture';

type GeometryData = Record<string, any> | undefined;

type MaterialData = Record<string, any> | undefined;

export class MeshComponentProxy extends SceneComponentProxy {
  public override sceneObject: THREE.Mesh;

  constructor(
    [geometryData, materialData]: [GeometryData, MaterialData] = [undefined, undefined],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([geometryData, materialData], tb, id, thread, renderer);

    this.sceneObject = new THREE.Mesh(...this.getMeshArgs(geometryData, materialData));
  }

  protected getMeshArgs(geometryData: GeometryData, materialData: MaterialData): [BufferGeometry | undefined, Material | undefined] {
    const args: [BufferGeometry | undefined, Material | undefined] = [undefined, undefined];

    if (geometryData) {
      const { attributes, boundingSphere, index } = geometryData.data;
      const { normal, position, uv } = attributes;
      const geometry = new BufferGeometry();

      geometry.uuid = geometryData.uuid;
      geometry.setAttribute('position', createBufferAttribute({ ...position, type: position.type }));

      if (normal) geometry.setAttribute('normal', createBufferAttribute({ ...normal, type: normal.type }));
      if (uv) geometry.setAttribute('uv', createBufferAttribute({ ...uv, type: uv.type }));

      geometry.setIndex(createBufferAttribute({ ...index, normalized: false, itemSize: 1, type: 'Uint16Array' }));

      if (boundingSphere) {
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3().fromArray(boundingSphere.center), boundingSphere.radius);
      }

      args[0] = geometry;
    }

    if (materialData) {
      const materialConstructors = {
        LineBasicMaterial: THREE.LineBasicMaterial,
        LineDashedMaterial: THREE.LineDashedMaterial,
        MeshBasicMaterial: THREE.MeshBasicMaterial,
        MeshDepthMaterial: THREE.MeshDepthMaterial,
        MeshDistanceMaterial: THREE.MeshDistanceMaterial,
        MeshLambertMaterial: THREE.MeshLambertMaterial,
        MeshMatcapMaterial: THREE.MeshMatcapMaterial,
        MeshNormalMaterial: THREE.MeshNormalMaterial,
        MeshPhongMaterial: THREE.MeshPhongMaterial,
        MeshPhysicalMaterial: THREE.MeshPhysicalMaterial,
        MeshStandardMaterial: THREE.MeshStandardMaterial,
        MeshToonMaterial: THREE.MeshToonMaterial,
        PointsMaterial: THREE.PointsMaterial,
        RawShaderMaterial: THREE.RawShaderMaterial,
        ShaderMaterial: THREE.ShaderMaterial,
        ShadowMaterial: THREE.ShadowMaterial,
        SpriteMaterial: THREE.SpriteMaterial,
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
        params.map = new THREE.CanvasTexture(map.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
        params.map.uuid = map.uuid;
      }

      if (metalnessMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = metalnessMap;
        params.metalnessMap = new THREE.Texture(metalnessMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
        params.metalnessMap.uuid = metalnessMap.uuid;
      }

      if (normalMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy } = normalMap;
        params.normalMap = new THREE.CanvasTexture(normalMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
        params.normalMap.uuid = normalMap.uuid;
      }

      if (roughnessMap) {
        const { mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace } = roughnessMap;
        params.roughnessMap = new THREE.Texture(roughnessMap.source.data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);
        params.roughnessMap.uuid = roughnessMap.uuid;
      }

      args[1] = new materialConstructors[type as keyof typeof materialConstructors](params);
    }

    return args;
  }
}

@CLASS(proxy(EProxyThread.Render, MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  protected override bodyType: RAPIER.RigidBodyType | null = RAPIER.RigidBodyType.Fixed;

  public geometry: BufferGeometry | null = null;

  @PROP(serialize(ref))
  public material: Material | null = null;

  constructor(
    geometry: BufferGeometry | null,
    material: Material | null,
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

  public override copyFromObject3D(mesh: THREE.Mesh): void {
    super.copyFromObject3D(mesh);

    this.geometry = mesh.geometry;
    this.material = this.createMaterial((Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.AnyMaterial);
  }

  protected createMaterial(inMaterial: THREE.AnyMaterial): Material {
    let outMaterial: Material;

    if (inMaterial.type === 'MeshStandardMaterial') {
      const { color, roughness, metalness, map, lightMap, lightMapIntensity, aoMap, aoMapIntensity, emissive, emissiveIntensity, emissiveMap, bumpMap, bumpScale, normalMap, normalMapType, normalScale, displacementMap, displacementScale, displacementBias, roughnessMap, metalnessMap, alphaMap, envMap, envMapIntensity, wireframe, wireframeLinewidth, fog, flatShading } = inMaterial as MeshStandardMaterial;

      outMaterial = this.instantiationService.createInstance(MeshStandardMaterial, {
        color,
        roughness,
        metalness,
        map: map ? this.createTexture(map) : null,
        lightMap: lightMap ? this.createTexture(lightMap) : null,
        lightMapIntensity,
        aoMap: aoMap ? this.createTexture(aoMap) : null,
        aoMapIntensity,
        emissive,
        emissiveIntensity,
        emissiveMap: emissiveMap ? this.createTexture(emissiveMap) : null,
        bumpMap: bumpMap ? this.createTexture(bumpMap) : null,
        bumpScale,
        normalMap: normalMap ? this.createTexture(normalMap) : null,
        normalMapType,
        normalScale,
        displacementMap: displacementMap ? this.createTexture(displacementMap) : null,
        displacementScale,
        displacementBias,
        roughnessMap: roughnessMap ? this.createTexture(roughnessMap) : null,
        metalnessMap: metalnessMap ? this.createTexture(metalnessMap) : null,
        alphaMap: alphaMap ? this.createTexture(alphaMap) : null,
        envMap: envMap ? this.createTexture(envMap) : null,
        envMapIntensity,
        wireframe,
        wireframeLinewidth,
        fog,
        flatShading,
      });
    } else {
      outMaterial = this.instantiationService.createInstance(Material);
    }

    return outMaterial;
  }

  protected createTexture({ image, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace }: THREE.AnyTexture): Texture {
    return this.instantiationService.createInstance(Texture, image, mapping as THREE.Mapping, wrapS, wrapT, magFilter, minFilter, format as THREE.PixelFormat, type, anisotropy, colorSpace);
  }
}

export function createBufferAttribute({ type, array, itemSize, normalized }: THREE.IBufferAttributeJSON): THREE.BufferAttribute {
  const ArrayConstructor = Array.TYPED_ARRAY_CONSTRUCTORS[type];

  if (Array.isBigInt64Array(ArrayConstructor) || Array.isBigUint64Array(ArrayConstructor)) {
    throw new Error(`Cannot use BigInt arrays.`);
  }

  return new THREE.BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
}
