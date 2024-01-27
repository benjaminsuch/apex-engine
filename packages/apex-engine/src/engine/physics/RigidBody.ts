import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { PhysicsWorkerContext } from './PhysicsWorkerContext';

export type RigidBodyType = 'fixed' | 'dynamic' | 'kinematic-position' | 'kinematic-velocity';

export class RigidBodyProxy {
}

@CLASS(proxy(EProxyThread.Physics, RigidBodyProxy))
export class RigidBody {
  private handle: number | null = null;

  private isRegistered: boolean = false;

  private type: RigidBodyType = 'fixed';

  /**
   * Sets the type of the rigid-body.
   *
   * Important: The type can be set as long as it hasn't been registered via
   * `register` and will otherwise throw an error.
   *
   * @param type
   */
  public setType(type: RigidBodyType): void {
    if (this.isRegistered) {
      throw new Error(`Cannot change body type after it has been registered.`);
    }
    this.type = type;
  }

  public getType(): RigidBodyType {
    return this.type;
  }

  public register(): void {
    if (this.isRegistered) {
      return;
    }

    PhysicsWorkerContext.tasks.push({
      message: { type: 'create-rigidbody', data: { type: this.type } },
      onResponse: (handle: number): void => {
        this.handle = handle;
      },
    });

    this.isRegistered = true;
  }
}
