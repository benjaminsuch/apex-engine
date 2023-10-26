import { PROP } from '../class';
import { serialize } from '../class/specifiers/serialize';
import { Euler, Vector3 } from '../math';
import { ActorComponent } from './ActorComponent';

export type SceneObjectType = 'Box' | 'Object3D' | 'PerspectiveCamera';

export abstract class SceneComponent extends ActorComponent {
  //@PROP(serialize())
  public position: Vector3 = new Vector3();

  //@PROP(serialize())
  public rotation: Euler = new Euler();

  //@PROP(serialize())
  public scale: Vector3 = new Vector3();
}
