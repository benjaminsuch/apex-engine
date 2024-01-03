import { MeshComponent, MeshComponentProxy } from './MeshComponent';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export const proxyComponents = { MeshComponentProxy, SceneComponentProxy } as const;

const objectComponentMap = {
  Mesh: MeshComponent,
  Group: SceneComponent,
  Object3D: SceneComponent,
} as const;

type ComponentType<T = typeof objectComponentMap> = T[keyof T];

export function getComponentClassByObjectType(type: string): ComponentType {
  if (type in objectComponentMap) {
    return objectComponentMap[type as keyof typeof objectComponentMap];
  }
  throw new Error(`Cannot find component class for object type "${type}".`);
}
