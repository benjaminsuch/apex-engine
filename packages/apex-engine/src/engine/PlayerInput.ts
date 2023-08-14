import { type InputActionBinding, type InputComponent } from './components';
import { Vector3 } from './math';

const keyVal = new Vector3().set(1, 0, 0);

export class PlayerInput {
  private readonly keysWithEvents: Set<TKey> = new Set();

  private readonly keyStates: Map<TKey, KeyState> = new Map();

  private readonly axisMappings: InputAxisMap[] = [];

  private readonly actionMappings: InputActionMap[] = [];

  private readonly actionKeyMap: Map<InputActionBinding['name'], InputActionMap[]> = new Map();

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

  public processInputStack(inputStack: InputComponent[], delta: number) {
    for (const mapping of this.actionMappings) {
      if (this.keysWithEvents.has(mapping.key)) {
        const binding = this.actionKeyMap.get(mapping.name);

        if (!binding) {
          this.actionKeyMap.set(mapping.name, [mapping]);
        } else {
          binding.push(mapping);
        }
      }
    }

    for (let i = inputStack.length - 1; i >= 0; --i) {
      const component = inputStack[i];

      for (const axisBinding of component.axisBindings) {
        axisBinding.handle(delta);
      }

      for (const actionBinding of component.actionBindings) {
        const mappings = this.actionKeyMap.get(actionBinding.name);

        if (!mappings) continue;

        for (const mapping of mappings) {
          const keyState = this.keyStates.get(mapping.key) as KeyState;
          const isPressed = actionBinding.event === EKeyEvent.Pressed && keyState.isPressed;
          const isReleased = actionBinding.event === EKeyEvent.Released && !keyState.isPressed;

          if (isPressed || isReleased) {
            actionBinding.handle(delta);
          }
        }
      }
    }

    this.actionKeyMap.clear();
    this.keysWithEvents.clear();
  }

  public getKeyValue(key: TKey) {
    const keyState = this.keyStates.get(key);
    return keyState ? keyState.value : new Vector3();
  }

  public getKeyRawValue(key: TKey) {
    const keyState = this.keyStates.get(key);
    return keyState ? keyState.rawValue : new Vector3();
  }

  public addAxisMap(mapping: InputAxisMap) {
    let idx = -1;

    for (let i = this.axisMappings.length - 1; i >= 0; --i) {
      const { key, name } = this.axisMappings[i];

      if (idx > -1) continue;
      if (key === mapping.key && name === mapping.name) idx = i;
    }

    if (idx < 0) {
      this.axisMappings.push(mapping);
    }
  }

  public addActionMap(mapping: InputActionMap) {
    let idx = -1;

    for (let i = this.actionMappings.length - 1; i >= 0; --i) {
      const { key, name } = this.actionMappings[i];

      if (idx > -1) continue;
      if (key === mapping.key && name === mapping.name) idx = i;
    }

    if (idx < 0) {
      this.actionMappings.push(mapping);
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

  private handleMouseMove({ pageX, pageY, movementX, movementY }: MouseEvent) {
    const xState = this.keyStates.get('MouseX');
    const yState = this.keyStates.get('MouseY');

    let xScale = 1;
    let yScale = 1;

    for (let i = this.axisMappings.length - 1; i >= 0; --i) {
      const map = this.axisMappings[i];

      if (map.key === 'MouseX') xScale = map.scale;
      if (map.key === 'MouseY') yScale = map.scale;
    }

    const x = [
      new Vector3().set(pageX, movementX, 0),
      new Vector3().set(pageX * xScale, movementX * xScale, 0)
    ];
    const y = [
      new Vector3().set(pageY, movementY, 0),
      new Vector3().set(pageY * yScale, movementY * yScale, 0)
    ];

    if (!xState) {
      this.keyStates.set('MouseX', new KeyState(x[0], x[1]));
    } else {
      xState.rawValue = x[0];
      xState.value = x[1];
    }

    if (!yState) {
      this.keyStates.set('MouseY', new KeyState(y[0], y[1]));
    } else {
      yState.rawValue = y[0];
      yState.value = y[1];
    }
  }

  private handleMouseDown(event: MouseEvent) {
    console.log(event);
    console.log(this.keyStates);
  }

  private handleMouseUp(event: MouseEvent) {}

  private handleKeyDown(event: KeyboardEvent) {
    console.log(event);
    const key = event.code as TKey;
    let keyState = this.keyStates.get(key);

    if (!keyState) {
      keyState = new KeyState(keyVal, keyVal, true);
      this.keyStates.set(key, keyState);
    } else {
      keyState.lastUsedTime = event.timeStamp;
      keyState.isPressed = true;
    }

    keyState.eventCount++;

    this.keysWithEvents.add(key);
  }

  private handleKeyUp(event: KeyboardEvent) {
    const key = event.code as TKey;
    const keyState = this.keyStates.get(key);

    // The "keyup" event can only occur when the key has been pressed down before.
    // Therefor we won't handle the case of `keyState` being `undefined`.
    if (keyState) {
      keyState.lastUsedTime = event.timeStamp;
      keyState.isPressed = false;
      keyState.eventCount++;

      this.keysWithEvents.add(key);
    }
  }
}

export class InputActionMap {
  constructor(
    public readonly name: string,
    public readonly key: TKey,
    public shift: boolean = false,
    public ctrl: boolean = false,
    public alt: boolean = false,
    public cmd: boolean = false
  ) {}
}

export class InputAxisMap {
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

  public eventCount: number = 0;

  constructor(
    public rawValue: Vector3,
    public value: Vector3,
    public isPressed: boolean = false,
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
