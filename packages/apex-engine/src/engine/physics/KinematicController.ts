import { Vector3 } from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { ref, serialize, vec3 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { type Collider } from './Collider';

export class KinematicControllerProxy extends ProxyInstance {
  declare readonly offset: number;

  declare movement: [number, number, number];

  constructor(args: [number] = [0], tb: TripleBuffer, public override readonly id: number) {
    super(args, tb, id);

    this.offset = args[0];
  }

  public override tick(tick: IEngineLoopTickContext): void {
    console.log('movement', ...this.movement);
  }
}

@CLASS(proxy(EProxyThread.Physics, KinematicControllerProxy))
export class KinematicController {
  @PROP(serialize(ref))
  public collider: Collider | null = null;

  @PROP(serialize(vec3))
  public movement: Vector3 = new Vector3();

  constructor(public readonly offset: number) {}
}
