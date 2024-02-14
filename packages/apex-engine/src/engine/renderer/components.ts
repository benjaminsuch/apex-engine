import { type Group, Mesh, type Object3D } from 'three';

import { CameraComponent, CameraComponentProxy } from './CameraComponent';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';
import { SkeletonProxy } from './Skeleton';
import { SkinnedMeshComponent, SkinnedMeshComponentProxy } from './SkinnedMeshComponent';

export const proxyComponents = {
  CameraComponentProxy,
  MeshComponentProxy,
  SceneComponentProxy,
  SkinnedMeshComponentProxy,
  SkeletonProxy,
} as const;

const objectComponentMap = {
  Bone: SceneComponent,
  Mesh: MeshComponent,
  Group: SceneComponent,
  Object3D: SceneComponent,
  PerspectiveCamera: CameraComponent,
  SkinnedMesh: SkinnedMeshComponent,
} as const;

export type SceneComponentType<T = typeof objectComponentMap> = T[keyof T];

export function getComponentClassByObjectType(type: string): SceneComponentType {
  if (type in objectComponentMap) {
    return objectComponentMap[type as keyof typeof objectComponentMap];
  }
  throw new Error(`Cannot find component class for object type "${type}".`);
}

export function resolveComponent(obj: Object3D): [SceneComponentType, any[]] {
  return [getComponentClassByObjectType(obj.type), getComponentArgs(obj)];
}

export function getComponentArgs(obj: Object3D | Group | Mesh): any[] {
  if (obj instanceof Mesh) {
    return [obj.geometry, obj.material];
  }
  return [];
}
