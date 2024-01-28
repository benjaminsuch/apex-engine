import '../../launch/bootstrap';

import * as RAPIER from '@dimforge/rapier3d-compat';
import * as Comlink from 'comlink';

import { InstantiationService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { getTargetId } from '../core/class/decorators';
import { type IProxyOrigin } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { Flags } from '../Flags';
import { ProxyManager } from '../ProxyManager';
import { TickManager } from '../TickManager';
import { RigidBody } from './RigidBody';

export interface IRegisterRigidBodyReturn {
  id: number;
  tb: IProxyOrigin['tripleBuffer'];
}

export interface IInternalPhysicsWorkerContext {
  world: RAPIER.World;
  proxyManager: ProxyManager<IProxyOrigin>;
  tickManager: TickManager;
  initPhysicsStep(): void;
  finishPhysicsStep(): void;
  registerRigidBody(type: RAPIER.RigidBodyType): IRegisterRigidBodyReturn;
}

const services = new ServiceCollection();
const logger = new ConsoleLogger();

services.set(IConsoleLogger, logger);

const instantiationService = new InstantiationService(services);

self.addEventListener('message', onInit);

function onInit(event: MessageEvent): void {
  if (typeof event.data !== 'object') {
    return;
  }

  const { type } = event.data;

  if (type === 'init') {
    self.removeEventListener('message', onInit);

    Flags.PHYSICS_FLAGS = event.data.flag[0];

    RAPIER.init().then(() => {
      const context: IInternalPhysicsWorkerContext = {
        world: new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 }),
        tickManager: instantiationService.createInstance(TickManager),
        proxyManager: instantiationService.createInstance(ProxyManager),
        registerRigidBody(type) {
          const desc = createRigidBodyDesc(type).setTranslation(0, 0, 0);
          const proxyOrigin = instantiationService.createInstance(RigidBody, this.world.createRigidBody(desc)) as RigidBody & IProxyOrigin;

          return {
            id: getTargetId(proxyOrigin) as number,
            tb: proxyOrigin.tripleBuffer,
          };
        },
        initPhysicsStep(): void {
          this.world.step();
          TripleBuffer.swapReadBufferFlags(Flags.PHYSICS_FLAGS);
        },
        finishPhysicsStep(): void {},
      };

      Comlink.expose(context);

      console.log('RAPIER ready', context);
      self.postMessage({ type: 'init-response' });
    });
  }
}

function createRigidBodyDesc(type: RAPIER.RigidBodyType): RAPIER.RigidBodyDesc {
  if (type === RAPIER.RigidBodyType.Dynamic) {
    return RAPIER.RigidBodyDesc.dynamic();
  }
  if (type === RAPIER.RigidBodyType.Fixed) {
    return RAPIER.RigidBodyDesc.fixed();
  }
  if (type === RAPIER.RigidBodyType.KinematicPositionBased) {
    return RAPIER.RigidBodyDesc.kinematicPositionBased();
  }
  if (type === RAPIER.RigidBodyType.KinematicVelocityBased) {
    return RAPIER.RigidBodyDesc.kinematicVelocityBased();
  }

  throw new Error(`Unknown rigid body type.`);
}
