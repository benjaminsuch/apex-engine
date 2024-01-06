import { type NormalMapTypes, type Side } from 'three';

declare global {
  var DEFAULT_MAP: string;
  var IS_BROWSER: string;
  var IS_CLIENT: boolean;
  var IS_DEV: string;
  var IS_GAME: boolean;
  var IS_SERVER: boolean;

  type TClass<T = any> = { new (...args: any[]): T };

  type TypedArray =
    | typeof Float32Array
    | typeof Int8Array
    | typeof Int16Array
    | typeof Int32Array
    | typeof Uint8Array
    | typeof Uint16Array
    | typeof Uint32Array;

  type MaybePromise<T> = Promise<T> | T;

  type TypeOfClassMethod<T, M extends keyof T> = T[M] extends Function ? T[M] : never;

  type IntervalReturn = number | NodeJS.Timer | undefined;

  type TimeoutReturn = number | NodeJS.Timeout | undefined;
}

export {};

module 'three' {
  export interface IImageJSON {
    url?: string;
    uuid: string;
  }

  export interface IMaterialJSON {
    aoMap: string | null;
    aoMapIntensity: number;
    blendColor: number;
    color: number;
    emissive: number;
    envMapIntensity: number;
    map: string;
    metalness: number;
    metalnessMap: string | null;
    name: string;
    normalMap: string | null;
    normalMapType: NormalMapTypes;
    normalScale: [number, number];
    roughness: number;
    roughnessMap: string | null;
    side: Side;
    type: string;
    uuid: string;
  }

  export interface INormalizedMaterialJSON extends Omit<IMaterialJSON, 'aoMap' | 'map' | 'metalnessMap' | 'roughnessMap'> {
    aoMap?: ITextureJSON;
    map?: ITextureJSON;
    metalnessMap?: ITextureJSON;
    roughnessMap?: ITextureJSON;
  }

  export interface ITextureJSON {
    anisotropy: number;
    center: [number, number];
    channel: number;
    colorSpace: 'srgb';
    flipY: boolean;
    format: number;
    generateMipmaps: boolean;
    image: string;
    internalFormat: null;
    magFilter: number;
    mapping: number;
    minFilter: number;
    name: string;
    offset: [number, number];
    premultiplyAlpha: boolean;
    repeat: [number, number];
    rotation: number;
    type: number;
    unpackAlignment: number;
    userData: Record<string, unknown>;
    uuid: string;
    wrap: [number, number];
  }

  export interface IBufferAttributeJSON {
    array: number[];
    itemSize: number;
    normalized: boolean;
    type: string;
  }

  export interface IGeometryData {
    attributes: {
      normal: IBufferAttributeJSON;
      position: IBufferAttributeJSON;
      uv: IBufferAttributeJSON;
    };
    boundingSphere: {
      center: number[];
      radius: number;
    };
    index: {
      array: number[];
      type: string;
    };
  }

  export interface IGeometryJSON {
    data: IGeometryData;
    type: string;
    uuid: string;
  }

  export type Object3DChild = IObject3DJSON | IMeshJSON;

  export interface IObject3DJSON<T extends string = 'Object3D'> {
    children: Array<Object3DChild>;
    layers: number;
    matrix: number[];
    name: string;
    type: T;
    up: [number, number, number];
    userData: Record<string, unknown>;
    uuid: string;
  }

  export interface IMeshJSON extends IObject3DJSON<'Mesh'> {
    geometry: string;
    material: string;
  }

  export interface ISceneJSON {
    geometries: IGeometryJSON[];
    images: IImageJSON[];
    materials: IMaterialJSON[];
    object: IObject3DJSON<'Group'>;
    textures: ITextureJSON[];
  }
}
