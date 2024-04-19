export default {
  targets: [
    {
      target: 'game',
      platform: 'browser',
      defaultMap: 'Level_1/Level_1',
      defaultPawn: './TopDownCharacter',
      plugins: [],
    },
    {
      target: 'game',
      platform: 'electron',
      defaultMap: 'Level_1/Level_1',
      defaultPawn: './TopDownCharacter',
      plugins: [],
    },
    {
      target: 'server',
      platform: 'node',
      defaultMap: 'Level_1/Level_1',
      defaultPawn: './TopDownCharacter',
      plugins: [],
    },
  ],
};
