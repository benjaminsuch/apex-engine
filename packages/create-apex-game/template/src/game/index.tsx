import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import { Box } from './Game';

createRoot(document.getElementById('root') as HTMLElement).render(
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}
  >
    <Canvas>
      <Suspense fallback={null}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />
      </Suspense>
    </Canvas>
  </div>
);
