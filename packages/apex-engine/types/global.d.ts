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

  type TKey =
    | 'AltLeft'
    | 'AltRight'
    | 'ArrowDown'
    | 'ArrowLeft'
    | 'ArrowRight'
    | 'ArrowUp'
    | 'Backquote'
    | 'ControlLeft'
    | 'ControlRight'
    | 'Digit1'
    | 'Digit2'
    | 'Digit3'
    | 'Digit4'
    | 'Digit5'
    | 'Digit6'
    | 'Digit7'
    | 'Digit8'
    | 'Digit9'
    | 'Digit0'
    | 'Equal'
    | 'KeyA'
    | 'KeyB'
    | 'KeyC'
    | 'KeyD'
    | 'KeyE'
    | 'KeyF'
    | 'KeyG'
    | 'KeyH'
    | 'KeyI'
    | 'KeyJ'
    | 'KeyK'
    | 'KeyL'
    | 'KeyM'
    | 'KeyN'
    | 'KeyO'
    | 'KeyP'
    | 'KeyQ'
    | 'KeyR'
    | 'KeyS'
    | 'KeyT'
    | 'KeyU'
    | 'KeyV'
    | 'KeyW'
    | 'KeyX'
    | 'KeyY'
    | 'KeyZ'
    | 'Minus'
    | 'MouseLeftClick'
    | 'MouseRightClick'
    | 'MouseX'
    | 'MouseY'
    | 'Space'
    | 'Tab';

  type TypeOfClassMethod<T, M extends keyof T> = T[M] extends Function ? T[M] : never;
}

export {};
