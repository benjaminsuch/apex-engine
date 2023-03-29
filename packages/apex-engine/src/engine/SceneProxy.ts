import { BoxGeometry, Euler, Matrix4, Mesh, MeshBasicMaterial, Quaternion } from 'three';

import { Vector3 } from './math';

export class SceneProxy {
  private readonly position: Vector3;

  private readonly scale: Vector3;

  private readonly rotation: Vector3 = new Vector3();

  private readonly quaternion: Quaternion = new Quaternion();

  private readonly matrix: Matrix4 = new Matrix4();

  private readonly matrixWorld: Matrix4 = new Matrix4();

  private visible: boolean = true;

  public readonly mesh: Mesh;

  constructor(sceneComponent: Record<string, any>) {
    this.mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0x00ff00 }));

    this.position = new Vector3(sceneComponent.position);
    this.rotation = new Vector3(sceneComponent.rotation);
    this.scale = new Vector3(sceneComponent.scale);
  }

  public tick() {
    this.mesh.rotation.x = this.rotation.x;
    this.mesh.rotation.y = this.rotation.y;
    this.mesh.rotation.z = this.rotation.z;
  }
}
