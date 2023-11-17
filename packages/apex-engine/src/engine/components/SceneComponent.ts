import { Euler, Vector3 } from '../math';
import { ActorComponent } from './ActorComponent';

export type SceneObjectType = 'Box' | 'Object3D' | 'PerspectiveCamera';

export abstract class SceneComponent extends ActorComponent {
  public position: Vector3 = new Vector3();

  public rotation: Euler = new Euler();

  public scale: Vector3 = new Vector3();
}
