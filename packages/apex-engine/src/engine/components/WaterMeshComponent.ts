import { BufferGeometry, Mesh, ShaderMaterial } from 'three';

import { SceneComponent } from './SceneComponent';

export class WaterMeshComponent extends SceneComponent {
  public sceneObject: Mesh<BufferGeometry, ShaderMaterial>;

  public momentum: number = 1;

  constructor() {
    super();

    this.sceneObject = new Mesh();
  }

  public tick() {
    this.sceneObject.material.uniforms.time.value += (1.0 / 60.0) * this.momentum;
  }
}
