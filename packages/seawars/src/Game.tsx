import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>
);

export function Game() {
  if (IS_CLIENT) {
    console.log('is client');
  }
  return <div>Game</div>;
}
