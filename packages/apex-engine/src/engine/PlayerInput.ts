import { type InputAxisBinding, type InputActionBinding, type InputComponent } from './components';
import { Vector3 } from './math';

export class PlayerInput {
  private readonly keyStates: Map<TKey, KeyState> = new Map();

  private readonly axisMappings: InputAxisMap[] = [];

  private readonly axisKeyMap: Map<InputAxisBinding['name'], InputAxisMap[]> = new Map();

  private readonly actionMappings: InputActionMap[] = [];

  private readonly actionKeyMap: Map<InputActionBinding['name'], InputActionMap[]> = new Map();

  private isKeyMapBuilt: boolean = false;

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
    this.buildKeyMappings();

    const keysToConsume = new Set<TKey>();
    const axisBindingsToExecute: InputAxisBinding[] = [];

    for (let i = inputStack.length - 1; i >= 0; --i) {
      const inputComponent = inputStack[i];

      //inputComponent.buildKeyMap()
      for (const axisBinding of inputComponent.axisBindings) {
        axisBinding.value = this.determineAxisValue(axisBinding, keysToConsume);
        axisBindingsToExecute.push(axisBinding);
      }

      for (const key of keysToConsume) {
        const keyState = this.keyStates.get(key);

        if (keyState) {
          keyState.isConsumed = true;
        }
      }

      keysToConsume.clear();
    }

    for (const axisBinding of axisBindingsToExecute) {
      axisBinding.handle(axisBinding.value);
    }

    for (let i = inputStack.length - 1; i >= 0; --i) {
      const inputComponent = inputStack[i];

      for (const axisBinding of inputComponent.axisBindings) {
        axisBinding.value = 0;
      }
    }

    for (const keyState of this.keyStates.values()) {
      keyState.isConsumed = false;
      keyState.sampleCount = 0;
    }
  }

  public getKeyValue(key: TKey) {
    const keyState = this.keyStates.get(key);
    return keyState ? keyState.value.x : 0;
  }

  public getKeyRawValue(key: TKey) {
    const keyState = this.keyStates.get(key);
    return keyState ? keyState.rawValue.x : 0;
  }

  public addMapping(mapping: InputActionMap | InputAxisMap) {
    const mappings = mapping instanceof InputActionMap ? this.actionMappings : this.axisMappings;

    for (let i = mappings.length - 1; i >= 0; --i) {
      const { key, name } = mappings[i];

      if (key === mapping.key && name === mapping.name) {
        return false;
      }
    }

    if (mapping instanceof InputActionMap) {
      this.actionMappings.push(mapping);
    } else {
      this.axisMappings.push(mapping);
    }

    return true;
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

  private handleMouseMove({ movementX, movementY }: MouseEvent) {
    let xState = this.keyStates.get('MouseX');
    let yState = this.keyStates.get('MouseY');

    const x = new Vector3().set(movementX, 0, 0);
    const y = new Vector3().set(movementY, 0, 0);

    if (!xState) {
      xState = new KeyState(x, x);
      this.keyStates.set('MouseX', xState);
    } else {
      xState.rawValue = x;
      xState.value = x;
    }

    xState.sampleCount++;

    if (!yState) {
      yState = new KeyState(y, y);
      this.keyStates.set('MouseY', yState);
    } else {
      yState.rawValue = y;
      yState.value = y;
    }

    yState.sampleCount++;
  }

  private handleMouseDown(event: MouseEvent) {
    console.log(event);
    console.log(this.keyStates);
  }

  private handleMouseUp(event: MouseEvent) {}

  private handleKeyDown(event: KeyboardEvent) {
    //let state = this.keyStates.get(event.code as TKey);
  }

  private handleKeyUp(event: KeyboardEvent) {}

  private determineAxisValue(axisBinding: InputAxisBinding, keysToConsume: Set<TKey>) {
    const keyMappings = this.axisKeyMap.get(axisBinding.name);

    let value = 0;

    if (keyMappings) {
      for (let i = 0; i < keyMappings.length; ++i) {
        const { key, scale } = keyMappings[i];
        const keyState = this.keyStates.get(key);

        if (keyState && keyState.sampleCount > 0) {
          value += this.getKeyValue(key) * scale;
          keysToConsume.add(key);
        }
      }
    }

    return value;
  }

  private buildKeyMappings() {
    if (this.axisKeyMap.size === 0) {
      for (const axisMapping of this.axisMappings) {
        if (!this.axisKeyMap.has(axisMapping.name)) {
          this.axisKeyMap.set(axisMapping.name, []);
        }

        const keyMappings = this.axisKeyMap.get(axisMapping.name) as InputAxisMap[];

        let add = true;

        for (const keyMapping of keyMappings) {
          if (keyMapping.key === axisMapping.key) {
            add = false;
            break;
          }
        }

        if (add) {
          keyMappings.push(axisMapping);
        }
      }
    }

    this.isKeyMapBuilt = true;
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

  public sampleCount: number = 0;

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
