declare global {
  var DEFAULT_LEVEL: string;
  var IS_BROWSER: string;
  var IS_CLIENT: boolean;
  var IS_DEV: string;
  var IS_GAME: boolean;
  var IS_SERVER: boolean;
  var RENDER_ON_MAIN_THREAD: string;

  enum Thread {
    Game = 'game',
    Render = 'render'
  }

  enum EngineTarget {
    Client = 'client',
    Game = 'game',
    Server = 'server'
  }

  type TypeOfClassMethod<T, M extends keyof T> = T[M] extends Function ? T[M] : never;
}

export {};
