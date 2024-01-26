import 'reflect-metadata';

import RAPIER from '@dimforge/rapier3d-compat';
import * as Comlink from 'comlink';

export interface IInternalPhysicsWorkerContext {
  world: RAPIER.World;
  initPhysicsStep(): void;
  finishPhysicsStep(): void;
}

const context: IInternalPhysicsWorkerContext = {
  world: null!,
  initPhysicsStep(): void {
    // console.log('init physics step');
  },
  finishPhysicsStep(): void {
    // console.log('finish physics step');
  },
};

Comlink.expose(context);

RAPIER.init().then(() => {
  console.log('RAPIER ready');
  context.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
});
