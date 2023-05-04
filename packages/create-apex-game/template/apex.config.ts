import { defineConfig } from 'apex-engine';

export default defineConfig({
  targets: [
    {
      target: 'client',
      platform: 'browser',
      defaultLevel: 'maps/index.js'
    },
    {
      target: 'client',
      platform: 'electron',
      defaultLevel: 'electron/maps/index.js'
    }
  ]
});
