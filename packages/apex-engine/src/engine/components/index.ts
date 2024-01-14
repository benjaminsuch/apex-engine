import { BufferAttribute, BufferGeometry, type IGeometryJSON, type IMaterialJSON, type INormalizedMaterialJSON, type ISceneJSON, type Material, MeshStandardMaterial, type Object3DChild, Sphere, Vector2, Vector3 } from 'three';

import { MeshComponent, MeshComponentProxy } from './MeshComponent';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export const proxyComponents = { MeshComponentProxy, SceneComponentProxy } as const;

const objectComponentMap = {
  Mesh: MeshComponent,
  Group: SceneComponent,
  Object3D: SceneComponent,
} as const;

export type SceneComponentType<T = typeof objectComponentMap> = T[keyof T];

export function getComponentClassByObjectType(type: string): SceneComponentType {
  if (type in objectComponentMap) {
    return objectComponentMap[type as keyof typeof objectComponentMap];
  }
  throw new Error(`Cannot find component class for object type "${type}".`);
}

export function resolveComponent(child: Object3DChild, scene: ISceneJSON): [SceneComponentType, any[]] {
  return [getComponentClassByObjectType(child.type), getComponentArgs(child, scene)];
}

export function getComponentArgs(child: Object3DChild, scene: ISceneJSON): any[] {
  if (child.type === 'Mesh') {
    const args: [IGeometryJSON | undefined, IMaterialJSON | INormalizedMaterialJSON | undefined] = [
      scene.geometries.find(({ uuid }) => child.geometry === uuid),
      scene.materials.find(({ uuid }) => child.material === uuid),
    ];

    let geometry: BufferGeometry | undefined;

    if (args[0]) {
      const { attributes: { position, normal, uv }, index, boundingSphere } = args[0].data;

      geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(position.array), position.itemSize));
      geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normal.array), normal.itemSize));
      geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uv.array), uv.itemSize));
      geometry.setIndex(new BufferAttribute(new Uint16Array(index.array), 1));
      geometry.boundingSphere = new Sphere(new Vector3().fromArray(boundingSphere.center), boundingSphere.radius);
    }

    let material: Material | undefined;

    if (args[1]) {
      const { aoMap, map, metalnessMap, normalMap, normalScale, roughnessMap, type, ...params } = args[1];

      if (type === 'MeshStandardMaterial') {
        material = new MeshStandardMaterial({ ...params, normalScale: new Vector2(...normalScale) });
      }
      // material = {
      //   ...material,
      //   aoMap: scene.textures.find(({ uuid }) => uuid === material?.aoMap),
      //   map: scene.textures.find(({ uuid }) => uuid === material?.map),
      //   metalnessMap: scene.textures.find(({ uuid }) => uuid === material?.map),
      //   roughnessMap: scene.textures.find(({ uuid }) => uuid === material?.map),
      // };
    }

    return [geometry, material];
  }
  return [];
}
