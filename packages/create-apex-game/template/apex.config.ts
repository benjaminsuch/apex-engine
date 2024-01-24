export default {
  targets: [
    {
      target: 'game',
      platform: 'browser',
      defaultMap: 'Level_1/Level_1',
      defaultPawn: './ThirdPersonCharacter',
      plugins: [],
    },
    {
      target: 'game',
      platform: 'electron',
      defaultMap: 'Level_1/Level_1',
      defaultPawn: './ThirdPersonCharacter',
      plugins: [],
    },
  ],
};
