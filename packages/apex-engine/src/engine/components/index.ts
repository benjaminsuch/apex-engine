import { type IMaterialJSON, type INormalizedMaterialJSON, type ISceneJSON, type Object3DChild } from 'three';

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
    let geometry = scene.geometries.find(({ uuid }) => child.geometry === uuid);
    let material: IMaterialJSON | INormalizedMaterialJSON | undefined = scene.materials.find(({ uuid }) => child.material === uuid);

    if (material) {
      material = {
        ...material,
        aoMap: scene.textures.find(({ uuid }) => uuid === material?.aoMap),
        map: scene.textures.find(({ uuid }) => uuid === material?.map),
        metalnessMap: scene.textures.find(({ uuid }) => uuid === material?.map),
        roughnessMap: scene.textures.find(({ uuid }) => uuid === material?.map),
      };
    }

    return [geometry, material];
  }
  return [];
}
