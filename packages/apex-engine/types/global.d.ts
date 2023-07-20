declare global {
  var IS_CLIENT: boolean;
  var IS_GAME: boolean;
  var IS_SERVER: boolean;
  var DEFAULT_LEVEL: string;
  var RENDER_ON_MAIN_THREAD: string;
  var IS_DEV: string;

  enum Thread {
    Game = 'game',
    Render = 'render'
  }

  enum EngineTarget {
    Client = 'client',
    Game = 'game',
    Server = 'server'
  }
}

export {};
