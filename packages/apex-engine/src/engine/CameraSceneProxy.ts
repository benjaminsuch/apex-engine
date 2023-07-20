import { PerspectiveCamera } from 'three';

import { SceneProxy, type SceneProxyConstructorData } from './SceneProxy';

export interface CameraProxyConstructorData extends SceneProxyConstructorData {
  buffer: ArrayBufferLike;
}

export class CameraSceneProxy extends SceneProxy {
  readonly #data: Float32Array;

  /**
   * Buffer offset: 0
   */
  #fov: number;

  get fov() {
    return this.#data[0];
  }

  set fov(val) {
    this.#data.set([val]);
    this.#fov = this.#data[0];
    this.sceneObject.fov = this.#fov;
  }

  /**
   * Buffer offset: 1
   */
  #aspect: number;

  public get aspect() {
    return this.#data[1];
  }

  public set aspect(val) {
    this.#data.set([val], 1);
    this.#aspect = this.#data[1];
    this.sceneObject.aspect = this.#aspect;
  }

  /**
   * Buffer offset: 2
   */
  #far: number;

  get far() {
    return this.#data[2];
  }

  set far(val) {
    this.#data.set([val], 2);
    this.#far = this.#data[2];
    this.sceneObject.far = this.#far;
  }

  /**
   * Buffer offset: 3
   */
  #near: number;

  get near() {
    return this.#data[3];
  }

  set near(val) {
    this.#data.set([val], 3);
    this.#near = this.#data[3];
    this.sceneObject.near = this.#near;
  }

  public override sceneObject: PerspectiveCamera;

  constructor({ buffer, ...data }: CameraProxyConstructorData) {
    super(data);

    this.#data = new Float32Array(buffer);

    const [fov, aspect, far, near] = this.#data;

    this.#fov = fov;
    this.#aspect = aspect;
    this.#far = far;
    this.#near = near;
    this.sceneObject = new PerspectiveCamera(fov, aspect, near, far);
  }

  public updateProjectionMatrix() {
    this.sceneObject.updateProjectionMatrix();
  }

  public updateMatrixWorld(force?: boolean) {
    this.sceneObject.updateMatrixWorld(force);
  }
}
