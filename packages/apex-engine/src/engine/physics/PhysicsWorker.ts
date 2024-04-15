import * as RAPIER from '@dimforge/rapier3d-compat';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { getTargetId } from '../core/class/decorators';
import { EProxyThread, type IProxyConstructionData } from '../core/class/specifiers/proxy';
import { type TripleBufferJSON } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { Flags } from '../Flags';
import { Collider, type ColliderRegisterArgs, getColliderDescConstructor } from '../physics/Collider';
import { KinematicController, type KinematicControllerConstructorArgs } from '../physics/KinematicController';
import { PhysicsInfo } from '../physics/PhysicsInfo';
import { type PhysicsWorkerTaskJSON } from '../physics/PhysicsTaskManager';
import { createRigidBodyDesc, RigidBody } from '../physics/RigidBody';
import { ProxyManager } from '../ProxyManager';
import { ETickGroup, TickManager } from '../TickManager';

export interface ICreatedProxyData {
  id: number;
  tb: TripleBufferJSON;
}

export class PhysicsWorker {
  private renderPort!: MessagePort;

  private readonly tickManager: TickManager;

  public isInitialized: boolean = false;

  public info!: PhysicsInfo;

  public world!: RAPIER.World;

  public readonly proxyManager: ProxyManager;

  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    this.tickManager = this.instantiationService.createInstance(TickManager);
    this.proxyManager = this.instantiationService.createInstance(ProxyManager, EProxyThread.Physics, {});
  }

  public async init({ flags, renderPort }: any): Promise<void> {
    if (this.isInitialized) {
      this.logger.error(this.constructor.name, `Already initialized`);
      return;
    }

    this.renderPort = renderPort;
    Flags.PHYSICS_FLAGS = flags[0];

    await RAPIER.init();

    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
    this.info = this.instantiationService.createInstance(PhysicsInfo, Flags.PHYSICS_FLAGS, undefined);
  }

  public createProxies(stack: IProxyConstructionData[]): void {
    this.logger.debug('Create proxies:', stack);
    this.proxyManager.registerProxies(stack);
  }

  public registerRigidBody(type: RAPIER.RigidBodyType, options: { position?: [number, number, number] } = {}): ICreatedProxyData {
    this.logger.debug(`Register RigidBody`);

    const desc = createRigidBodyDesc(type);

    if (options) {
      const { position } = options;

      if (position) {
        const [x, y, z] = position;
        desc.setTranslation(x, y, z);
      }
    }

    const proxyOrigin = this.instantiationService.createInstance(RigidBody, this.world.createRigidBody(desc), this);

    return {
      id: getTargetId(proxyOrigin) as number,
      tb: proxyOrigin.tripleBuffer,
    };
  }

  public registerCollider<T extends RAPIER.ShapeType>(type: T, { rigidBodyId, ...args }: ColliderRegisterArgs<T>): ICreatedProxyData {
    this.logger.debug(`Register Collider (rigidBodyId=${rigidBodyId})`,);

    // @ts-ignore
    const desc = getColliderDescConstructor(type)(...Object.values(args));
    const proxyOrigin = this.instantiationService.createInstance(Collider, desc, rigidBodyId, this);

    return {
      id: getTargetId(proxyOrigin) as number,
      tb: proxyOrigin.tripleBuffer,
    };
  }

  public registerKinematicController(options: KinematicControllerConstructorArgs): ICreatedProxyData {
    this.logger.debug(`Register KinematicController`);

    const controller = this.instantiationService.createInstance(KinematicController, options, this);

    return {
      id: getTargetId(controller) as number,
      tb: controller.tripleBuffer,
    };
  }

  public async step(tick: IEngineLoopTickContext, tasks: PhysicsWorkerTaskJSON[]): Promise<void> {
    // I thought about converting them into tick functions, but I don't think it would
    // add any value, except consistency. While I do prefer consistency, the performance
    // loss makes it not worth it (creating tick function instances and then sort them
    // at every `step` call (the tasks already come in correct order)).
    let task: PhysicsWorkerTaskJSON | undefined;

    while (task = tasks.shift()) {
      const origin = this.proxyManager.getOrigin(task.proxy);

      if (origin) {
        const descriptor = origin[task.name as keyof typeof origin];

        if (typeof descriptor === 'function') {
          (descriptor as Function).apply(origin, task.params);
        }
      }
    }

    this.tickManager.startTick(tick);

    await this.tickManager.runTickGroup(ETickGroup.PrePhysics);

    this.world.timestep = tick.delta;
    this.world.step();

    await this.tickManager.runTickGroup(ETickGroup.PostPhysics);

    this.tickManager.endTick();

    this.renderPort.postMessage({ type: 'physics-debug-buffers', ...this.world.debugRender() });
  }
}
