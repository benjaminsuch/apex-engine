import type { InputAxisBinding, InputActionBinding, InputComponent } from './components';
import { Vector3 } from './math';

export class PlayerInput {
  private readonly keyStates: Map<TKey, KeyState> = new Map();

  private readonly axisMappings: InputAxisMap[] = [];

  private readonly axisKeyMap: Map<InputAxisBinding['name'], InputAxisMap[]> = new Map();

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
    const axisBindingsToExec: InputAxisBinding[] = [];
    const keysWithEvents: Set<TKey> = new Set();

    for (const [key, keyState] of this.keyStates) {
      if (keyState.eventCount > 0) {
        keysWithEvents.add(key);
      }

      const keyMappings: InputAxisMap[] = [];

      // Create axis key map
      for (const axisMap of this.axisMappings) {
        if (axisMap.key === key) {
          keyMappings.push(axisMap);
        }
      }

      this.axisKeyMap.set(key, keyMappings);
      keyState.eventCount = 0;
    }

    for (let i = inputStack.length - 1; i >= 0; --i) {
      const inputComponent = inputStack[i];

      for (const key of keysWithEvents) {
        const mappings = this.axisKeyMap.get(key);
        const keyState = this.keyStates.get(key);

        if (key !== 'MouseX' && key !== 'MouseY' && !keyState?.isPressed) continue;

        if (keyState && mappings) {
          for (const axisMapping of mappings) {
            for (const axisBinding of inputComponent.axisBindings) {
              if (axisBinding.name !== axisMapping.name) continue;

              axisBinding.value = keyState.value.x * axisMapping.scale;
              axisBindingsToExec.push(axisBinding);
            }
          }
        }
      }

      for (const axisBinding of axisBindingsToExec) {
        axisBinding.handle(axisBinding.value);
        axisBinding.value = 0;
      }
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

    xState.eventCount++;

    if (!yState) {
      yState = new KeyState(y, y);
      this.keyStates.set('MouseY', yState);
    } else {
      yState.rawValue = y;
      yState.value = y;
    }

    yState.eventCount++;
  }

  private handleMouseDown(event: MouseEvent) {
    console.log(event);
    console.log(this.keyStates);
  }

  private handleMouseUp(event: MouseEvent) {}

  private handleKeyDown(event: KeyboardEvent) {
    const key = event.code as TKey;
    const val = new Vector3().set(1, 0, 0);

    let state = this.keyStates.get(key);

    if (!state) {
      state = new KeyState(val, val);
      this.keyStates.set(key, state);
    }

    state.isPressed = true;
    state.eventAccumulator[EKeyEvent.Pressed]++;
    state.eventCount++;
  }

  private handleKeyUp(event: KeyboardEvent) {
    const state = this.keyStates.get(event.code as TKey);

    if (state) {
      state.isPressed = false;
      state.eventAccumulator[EKeyEvent.Released]++;
      state.eventCount++;
    }
  }
}

export class InputAxisConfig {
  constructor(
    public readonly name: string,
    public sensivity: number = 1,
    public deadZone: number = 0.2,
    public exponent: number = 1,
    public invert: boolean = false
  ) {}
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
  public eventCount: number = 0;

  public readonly eventAccumulator: [number, number] = [0, 0];

  constructor(
    public rawValue: Vector3,
    public value: Vector3,
    public isPressed: boolean = false,
    public isConsumed: boolean = false
  ) {}
}

export enum EKeyEvent {
  Pressed = 0,
  Released = 1
}
