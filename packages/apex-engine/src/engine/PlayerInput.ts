export class PlayerInput {
  private readonly keyStates: Map<TKey, KeyState> = new Map();

  private readonly keyMappings: Array<InputKeyMap> = [];

  constructor() {
    if (IS_BROWSER) {
      window.addEventListener('contextmenu', this);
      window.addEventListener('keydown', this);
      window.addEventListener('keyup', this);
      window.addEventListener('mousedown', this);
      window.addEventListener('mousemove', this);
      window.addEventListener('mouseup', this);
    }
  }

  public getKeyValue(key: TKey) {
    const keyState = this.keyStates.get(key);
    return keyState ? keyState.value : 0;
  }

  public addInputMap(mapping: InputKeyMap) {
    const idx = this.keyMappings.findIndex(
      ({ key, name }) => key === mapping.key && name === mapping.name
    );

    if (idx < 0) {
      this.keyMappings.push(mapping);
    }
  }

  public handleEvent(event: KeyboardEvent | MouseEvent | PointerEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'contextmenu') this.handleContextMenu(event as PointerEvent);
    if (event.type === 'keydown') this.handleKeyDown(event as KeyboardEvent);
    if (event.type === 'keyup') this.handleKeyUp(event as KeyboardEvent);
    if (event.type === 'mousedown') this.handleMouseDown(event as MouseEvent);
    if (event.type === 'mousemove') this.handleMouseMove(event as MouseEvent);
    if (event.type === 'mouseup') this.handleMouseUp(event as MouseEvent);
  }

  private handleContextMenu(event: PointerEvent) {}

  private handleMouseMove({ pageX, pageY }: MouseEvent) {
    const xState = this.keyStates.get('MouseX');
    const yState = this.keyStates.get('MouseY');

    for (let i = this.keyMappings.length - 1; i > 0; i--) {
      const map = this.keyMappings[i];

      if (map.key === 'MouseX') {
        pageX = pageX * map.scale;
      }
      if (map.key === 'MouseY') {
        pageY = pageY * map.scale;
      }
    }

    if (!xState) {
      this.keyStates.set('MouseX', new KeyState(pageX, pageX));
    } else {
      xState.rawValue = pageX;
      xState.value = pageX;
    }

    if (!yState) {
      this.keyStates.set('MouseY', new KeyState(pageY, pageY));
    } else {
      yState.rawValue = pageY;
      yState.value = pageY;
    }
  }

  private handleMouseDown(event: MouseEvent) {
    console.log(this.keyStates);
  }

  private handleMouseUp(event: MouseEvent) {}

  private handleKeyDown(event: KeyboardEvent) {
    const key = event.code as TKey;
    const keyState = this.keyStates.get(key);

    if (!keyState) {
      this.keyStates.set(key, new KeyState(1, 1, true));
    } else {
      keyState.lastUsedTime = new Date().getTime();
      keyState.isDown = true;
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    const keyState = this.keyStates.get(event.code as TKey);

    // The "keyup" event can only occur when the key has been pressed down before.
    // Therefor we won't handle the case of `keyState` being `undefined`.
    if (keyState) {
      keyState.lastUsedTime = new Date().getTime();
      keyState.isDown = false;
    }
  }
}

export class InputKeyMap {
  constructor(
    public readonly name: string,
    public readonly key: TKey,
    public readonly scale: number
  ) {}
}

export class KeyState {
  /**
   * The last time the key was being used as timestamp in milliseconds.
   */
  public lastUsedTime: number = 0;

  constructor(
    public rawValue: number,
    public value: number,
    public isDown: boolean = false,
    public isConsumed: boolean = false
  ) {}
}

export type TKey =
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

export enum EKeyEvent {
  DoubleClick,
  Pressed,
  Released
}
