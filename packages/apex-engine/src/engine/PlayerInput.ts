export class PlayerInput {
  private readonly keyMappings: Map<TKeys, Set<InputKeyMap>> = new Map();

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

  public addInputMap(mapping: InputKeyMap) {
    const keyMappings = this.keyMappings.get(mapping.key);

    if (keyMappings) {
      keyMappings.add(mapping);
    } else {
      this.keyMappings.set(mapping.key, new Set([mapping]));
    }
  }

  public removeInputMap(mapping: InputKeyMap) {
    this.keyMappings.get(mapping.key)?.delete(mapping);
  }

  public handleEvent(event: KeyboardEvent | MouseEvent | PointerEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'contextmenu') this.handleContextMenu(event as PointerEvent);
    if (event.type === 'mousedown') this.handleMouseDown(event as MouseEvent);
    if (event.type === 'keydown') this.handleKeyDown(event as KeyboardEvent);
    if (event.type === 'keyup') this.handleKeyUp(event as KeyboardEvent);
    if (event.type === 'mousemove') this.handleMouseMove(event as MouseEvent);
    if (event.type === 'mouseup') this.handleMouseUp(event as MouseEvent);
  }

  private handleContextMenu(event: PointerEvent) {}

  private handleMouseMove(event: MouseEvent) {}

  private handleMouseDown(event: MouseEvent) {}

  private handleMouseUp(event: MouseEvent) {}

  private handleKeyDown(event: KeyboardEvent) {}

  private handleKeyUp(event: KeyboardEvent) {}
}

export class InputKeyMap {
  constructor(
    public readonly name: string,
    public readonly key: TKeys,
    public readonly scale: number
  ) {}
}

export type TKeys =
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
  | 'MouseX'
  | 'MouseY'
  | 'Space'
  | 'Tab';
