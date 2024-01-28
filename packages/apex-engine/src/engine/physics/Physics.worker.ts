import 'reflect-metadata';

import RAPIER from '@dimforge/rapier3d-compat';
import * as Comlink from 'comlink';

import { InstantiationService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
// import { type IProxyOrigin } from '../core/class/specifiers/proxy';
import { RigidBody } from './RigidBody';

export interface IInternalPhysicsWorkerContext {
  world: RAPIER.World;
  initPhysicsStep(): void;
  finishPhysicsStep(): void;
  registerRigidBody(type: RAPIER.RigidBodyType): RigidBody & any; // RAPIER.RigidBody['handle']
}

const services = new ServiceCollection();
const logger = new ConsoleLogger();

services.set(IConsoleLogger, logger);

const instantiationService = new InstantiationService(services);

RAPIER.init().then(() => {
  console.log('RAPIER ready');

  const context: IInternalPhysicsWorkerContext = {
    world: new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 }),
    registerRigidBody(type) {
      const desc = createRigidBodyDesc(type).setTranslation(0, 0, 0);
      const proxyOrigin = instantiationService.createInstance(RigidBody, this.world.createRigidBody(desc));
      return proxyOrigin as RigidBody & any;
    },
    initPhysicsStep(): void {

    },
    finishPhysicsStep(): void {
    },
  };

  Comlink.expose(context);
});

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
