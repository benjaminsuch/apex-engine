import { Bone, BoneProxy } from './Bone';
import { CameraComponent, CameraComponentProxy } from './CameraComponent';
import { Color, ColorProxy } from './Color';
import { BufferGeometry, BufferGeometryProxy } from './geometries/BufferGeometry';
import { CapsuleGeometry, CapsuleGeometryProxy } from './geometries/CapsuleGeometry';
import { Material, MaterialProxy } from './materials/Material';
import { MeshStandardMaterial, MeshStandardMaterialProxy } from './materials/MeshStandardMaterial';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';
import { SkeletonProxy } from './Skeleton';
import { SkinnedMeshComponent, SkinnedMeshComponentProxy } from './SkinnedMeshComponent';
import { Source, SourceProxy } from './textures/Source';
import { Texture, TextureProxy } from './textures/Texture';

export const proxyComponents = {
  BoneProxy,
  BufferGeometryProxy,
  CameraComponentProxy,
  CapsuleGeometryProxy,
  ColorProxy,
  MaterialProxy,
  MeshComponentProxy,
  MeshStandardMaterialProxy,
  SceneComponentProxy,
  SkeletonProxy,
  SkinnedMeshComponentProxy,
  SourceProxy,
  TextureProxy,
} as const;

const objectComponentMap = {
  Bone,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  Mesh: MeshComponent,
  Group: SceneComponent,
  Object3D: SceneComponent,
  PerspectiveCamera: CameraComponent,
  SkinnedMesh: SkinnedMeshComponent,
  Material,
  MeshStandardMaterial,
  Source,
  Texture,
} as const;

export type SceneComponentType<T = typeof objectComponentMap> = T[keyof T];
