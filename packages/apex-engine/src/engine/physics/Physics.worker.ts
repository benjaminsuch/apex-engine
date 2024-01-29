import '../../launch/bootstrap';

import * as RAPIER from '@dimforge/rapier3d-compat';
import * as Comlink from 'comlink';

import { InstantiationService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { getTargetId } from '../core/class/decorators';
import { EProxyThread, type IProxyConstructionData, type IProxyOrigin } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { Flags } from '../Flags';
import { ProxyManager, RegisteredProxy } from '../ProxyManager';
import { TickManager } from '../TickManager';
import { PhysicsCharacterControllerProxy } from './PhysicsCharacterController';
import { PhysicsInfo } from './PhysicsInfo';
import { RigidBody } from './RigidBody';

export interface IRegisterRigidBodyReturn {
  id: number;
  tb: IProxyOrigin['tripleBuffer'];
}

export interface IInternalPhysicsWorkerContext {
  world: RAPIER.World;
  info: PhysicsInfo;
  proxyManager: ProxyManager<IProxyOrigin>;
  tickManager: TickManager;
  createProxies(proxies: IProxyConstructionData[]): void;
  step(tasks: any[]): void;
  registerRigidBody(type: RAPIER.RigidBodyType): IRegisterRigidBodyReturn;
}

const proxyConstructors = { PhysicsCharacterControllerProxy };
const services = new ServiceCollection();
const logger = new ConsoleLogger();

services.set(IConsoleLogger, logger);

const instantiationService = new InstantiationService(services);

self.addEventListener('message', onInit);

// characterController.enableAutostep(0.7, 0.3, true);
// characterController.enableSnapToGround(0.7);
const defaultTasks = [
  {
    proxy: 1,
    method: 'setApplyImpulsesToDynamicBodies',
    params: [true],
  },
  {
    proxy: 1,
    method: 'enableAutostep',
    params: [0.7, 0.3, true],
  },
  {
    proxy: 1,
    method: 'enableSnapToGround',
    params: [0.7],
  },
];

function onInit(event: MessageEvent): void {
  if (typeof event.data !== 'object') {
    return;
  }

  if (event.data.type === 'init') {
    self.removeEventListener('message', onInit);

    Flags.PHYSICS_FLAGS = event.data.flags[0];

    RAPIER.init().then(() => {
      const context: IInternalPhysicsWorkerContext = {
        world: new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 }),
        info: instantiationService.createInstance(PhysicsInfo, Flags.PHYSICS_FLAGS, undefined),
        tickManager: instantiationService.createInstance(TickManager),
        proxyManager: instantiationService.createInstance(ProxyManager, proxyConstructors),
        createProxies(proxies) {
          logger.debug('Creating proxies:', proxies);

          for (let i = 0; i < proxies.length; ++i) {
            const { constructor, id, tb, args } = proxies[i];
            const ProxyConstructor = this.proxyManager.getProxyConstructor(constructor);

            if (!ProxyConstructor) {
              logger.warn(`Constructor (${constructor}) not found for proxy "${id}".`);
              return;
            }

            const proxy = instantiationService.createInstance(
              ProxyConstructor,
              args,
              new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
              id,
              this
            );

            this.proxyManager.registerProxy(EProxyThread.Render, proxy);
          }
        },
        registerRigidBody(type) {
          const desc = createRigidBodyDesc(type).setTranslation(0, 0, 0);
          const proxyOrigin = instantiationService.createInstance(RigidBody, this.world.createRigidBody(desc)) as RigidBody & IProxyOrigin;

          return {
            id: getTargetId(proxyOrigin) as number,
            tb: proxyOrigin.tripleBuffer,
          };
        },
        step(tasks): void {
          this.world.step();
          // for (let i = 0; i < this.proxyManager.proxies.entries; ++i) {
          //   const proxy = this.proxyManager.getProxy(i) as any;

          //   if (proxy) {
          //     proxy.tick({ delta: 0.016, elapsed: performance.now(), id: 1 });
          //   }
          // }

          for (const task of defaultTasks) {

          }
          // @todo: apply world updates to proxies
        },
      };

      Comlink.expose(context);

      console.log('RAPIER ready', context);
      self.postMessage({ type: 'init-response', tb: context.info.tripleBuffer });
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
