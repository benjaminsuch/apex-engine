import { Vector3 } from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { serialize, vec3 } from '../core/class/specifiers/serialize';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';

export class PhysicsCharacterControllerProxy extends ProxyInstance {
  declare movement: [number, number, number];

  public override tick(tick: IEngineLoopTickContext): void {
    console.log('movement', ...this.movement);
  }
}

@CLASS(proxy(EProxyThread.Physics, PhysicsCharacterControllerProxy))
export class PhysicsCharacterController {
  @PROP(serialize(vec3))
  public movement: Vector3 = new Vector3();
}
