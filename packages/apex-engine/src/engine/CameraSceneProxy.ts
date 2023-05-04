import { PerspectiveCamera } from 'three';

import { SceneProxy, type SceneProxyConstructorData } from './SceneProxy';

export interface CameraProxyConstructorData extends SceneProxyConstructorData {
  buffer: ArrayBufferLike;
}

export class CameraSceneProxy extends SceneProxy {
  readonly #data: Float32Array;

  public fov: number;

  public aspect: number;

  public far: number;

  public near: number;

  public override sceneObject: PerspectiveCamera;

  constructor({ buffer, ...data }: CameraProxyConstructorData) {
    super(data);

    this.#data = new Float32Array(buffer);

    const [fov, aspect, far, near] = this.#data;

    this.fov = fov;
    this.aspect = aspect;
    this.far = far;
    this.near = near;

    this.sceneObject = new PerspectiveCamera(fov, aspect, near, far);
  }

  public override tick(): void {
    super.tick();

    this.sceneObject.fov = this.fov;
    this.sceneObject.aspect = this.aspect;
    this.sceneObject.far = this.far;
    this.sceneObject.near = this.near;
  }
}
