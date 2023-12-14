export default {
  targets: [
    {
      target: 'game',
      platform: 'browser',
      defaultLevel: './maps/EntryLevel.js'
    },
    {
      target: 'game',
      platform: 'electron',
      defaultLevel: './maps/EntryLevel.js'
    }
  ]
};
