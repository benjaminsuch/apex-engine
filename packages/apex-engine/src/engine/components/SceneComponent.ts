import { Euler, Matrix4, Quaternion } from 'three';

import { TRenderSceneProxyInitMessage } from '../../platform/renderer/common';
import { Vector3 } from '../math';
import { ActorComponent } from './ActorComponent';

export interface SceneComponentJSON {}

export class SceneComponent extends ActorComponent {
  private readonly position: Vector3 = new Vector3();

  private readonly scale: Vector3 = new Vector3();

  private readonly rotation: Vector3 = new Vector3();

  private readonly quaternion: Quaternion = new Quaternion();

  private readonly matrix: Matrix4 = new Matrix4();

  private readonly matrixWorld: Matrix4 = new Matrix4();

  private visible: boolean = true;

  private readonly children: Set<SceneComponent> = new Set();

  public override init() {
    this.getOwner().renderer.send<TRenderSceneProxyInitMessage>({
      type: 'init-scene-proxy',
      component: this.toJSON()
    });

    super.init();
  }

  public attachToParent(parent: SceneComponent) {
    parent.children.add(this);
  }

  public toJSON(): any {
    return {
      position: this.position.toJSON(),
      scale: this.scale.toJSON(),
      rotation: this.rotation.toJSON(),
      quaternion: this.quaternion,
      matrix: this.matrix,
      matrixWorld: this.matrixWorld,
      visible: this.visible,
      children: [...this.children].map(child => child.toJSON())
    };
  }
}
