export default {
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
};
