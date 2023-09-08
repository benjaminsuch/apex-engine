import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D } from 'three';

import { Euler, Matrix4, Quaternion, Vector3 } from './math';
import { type SceneObjectType } from './components';

export interface SceneProxyConstructorData {
  uuid: string;
  objectType: SceneObjectType;
  position: ArrayBufferLike;
  scale: ArrayBufferLike;
  rotation: ArrayBufferLike;
  quaternion: ArrayBufferLike;
  matrix: ArrayBufferLike;
  matrixWorld: ArrayBufferLike;
  up: ArrayBufferLike;
  visible: boolean;
  children: SceneProxyConstructorData[];
}

export class SceneProxy {
  public readonly uuid: string;

  public readonly position: Vector3;

  public readonly scale: Vector3;

  public readonly rotation: Euler;

  public readonly quaternion: Quaternion;

  public readonly matrix: Matrix4;

  public readonly matrixWorld: Matrix4;

  public readonly up: Vector3;

  public visible: boolean = true;

  public readonly sceneObject: Object3D;

  constructor({
    matrix,
    matrixWorld,
    objectType,
    position,
    quaternion,
    rotation,
    scale,
    up,
    uuid
  }: SceneProxyConstructorData) {
    this.uuid = uuid;
    this.position = new Vector3(position);
    this.scale = new Vector3(scale);
    this.rotation = new Euler(rotation);
    this.quaternion = new Quaternion(quaternion);
    this.matrix = new Matrix4(matrix);
    this.matrixWorld = new Matrix4(matrixWorld);
    this.up = new Vector3(up);

    switch (objectType) {
      case 'Box':
        this.sceneObject = new Mesh(
          new BoxGeometry(1, 1, 1),
          new MeshBasicMaterial({ color: 0x00ff00 })
        );
        break;
      default:
        this.sceneObject = new Object3D();
    }
  }

  public tick() {
    this.sceneObject.position.fromArray(this.position.toArray());
    this.sceneObject.scale.fromArray(this.scale.toArray());

    const [rotX, rotY, rotZ] = this.rotation.toArray();
    this.sceneObject.rotation.fromArray([rotX, rotY, rotZ, this.rotation.order]);

    this.sceneObject.quaternion.fromArray(this.quaternion.toArray());
    this.sceneObject.matrix.fromArray(this.matrix.toArray());
    this.sceneObject.matrixWorld.fromArray(this.matrixWorld.toArray());
    this.sceneObject.up.fromArray(this.up.toArray());
  }

  public dispose() {}
}
