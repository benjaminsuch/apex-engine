console.log('PhysicsWorker');

import RAPIER from '@dimforge/rapier3d-compat';

RAPIER.init().then(() => {
  console.log('RAPIER ready');
});
