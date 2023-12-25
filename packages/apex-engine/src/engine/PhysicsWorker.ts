console.log('PhysicsWorker');
setTimeout(() => {
  self.postMessage({});
}, 500);

import RAPIER from '@dimforge/rapier3d-compat';

RAPIER.init().then(() => {
  console.log('RAPIER ready');
});
