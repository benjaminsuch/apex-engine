import { Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { type InputActionBinding, type InputComponent } from './InputComponent';
import { type ActionKeyMapping, type InputMappingContext } from './InputMappingContext';
import { ETriggerEvent } from './InputTriggers';

const vec = /* @__PURE__ */ new Vector3();

export class PlayerInput {
  private readonly keyStates: Partial<Record<TKey, KeyState>> = {};

  private readonly keysToConsume: Set<TKey> = new Set();

  private orderedInputContexts: InputMappingContext[] = [];

  /**
   * Stores registered input contexts with their priority.
   */
  private readonly registeredInputContexts: [InputMappingContext, number][] = [];

  private keyMappings: Partial<Record<TKey, ActionKeyMapping[]>> = {};

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (IS_BROWSER) {
      window.addEventListener('contextmenu', this);
      window.addEventListener('keydown', this);
      window.addEventListener('keyup', this);
      window.addEventListener('mousedown', this);
      window.addEventListener('mousemove', this);
      window.addEventListener('mouseup', this);
    }
  }

  public processInput(inputComponent: InputComponent, delta: number): void {
    let bindingsToExecute: InputActionBinding[] = [];

    for (const key of this.keysToConsume) {
      const actionMappings = this.keyMappings[key] ?? [];

      let value = vec.copy(this.keyStates[key]!.value);
      let triggerEvent: ETriggerEvent = ETriggerEvent.None;

      for (const actionMapping of actionMappings) {
        for (const modifier of actionMapping.modifiers.concat(actionMapping.action.modifiers)) {
          value = modifier.modify(value, delta);
        }

        actionMapping.action.value.add(value);

        triggerEvent = actionMapping.action.evaluateTriggers(
          this,
          actionMapping.triggers.concat(actionMapping.action.triggers),
          value,
          delta
        );

        for (const actionBinding of inputComponent.actionBindings) {
          if (actionMapping.action === actionBinding.action && actionBinding.triggerEvent === triggerEvent) {
            bindingsToExecute.push(actionBinding);
          }
        }
      }

      for (const binding of bindingsToExecute) {
        binding.exec();

        if (binding.action.consumeInput) {
          this.consumeKey(key);
        }
      }

      for (const actionBinding of inputComponent.actionBindings) {
        actionBinding.action.value.set(0, 0, 0);
      }

      bindingsToExecute = [];
    }
  }

  public addMappingContext(mappingContext: InputMappingContext, priority: number = Infinity): void {
    const idx = this.getMappingContextIndex(mappingContext);

    if (idx > -1) {
      this.logger.warn(this.constructor.name, `${mappingContext.constructor.name} has already been added.`);
      return;
    }

    priority = Math.min(priority, 0);

    this.registeredInputContexts.push([mappingContext, priority]);
    this.buildKeyMappings();
  }

  public removeMappingContext(mappingContext: InputMappingContext): void {
    const idx = this.getMappingContextIndex(mappingContext);

    if (idx > -1) {
      this.registeredInputContexts.removeAtSwap(idx);
      this.buildKeyMappings();
    }
  }

  public buildKeyMappings(): void {
    this.orderedInputContexts = this.registeredInputContexts.sort((a, b) => a[1] > b[1] ? 1 : -1).map(([mapping]) => mapping);

    const keyMappings: PlayerInput['keyMappings'] = {};

    for (let i = 0; i < this.orderedInputContexts.length; ++i) {
      const mappingContext = this.orderedInputContexts[i];

      for (let j = 0; j < mappingContext.mappings.length; ++j) {
        const keyMapping = mappingContext.mappings[j];

        if (!keyMappings[keyMapping.key]) {
          keyMappings[keyMapping.key] = [];
        }

        keyMappings[keyMapping.key]!.push(keyMapping);
      }
    }

    this.keyMappings = keyMappings;
  }

  public handleEvent(event: KeyboardEvent | MouseEvent | PointerEvent | TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'contextmenu') this.handleContextMenu(event as PointerEvent);
    if (event.type === 'keydown') this.handleKeyDown(event as KeyboardEvent);
    if (event.type === 'keyup') this.handleKeyUp(event as KeyboardEvent);
    if (event.type === 'mousedown') this.handleMouseDown(event as MouseEvent);
    if (event.type === 'mousemove') this.handleMouseMove(event as MouseEvent);
    if (event.type === 'mouseup') this.handleMouseUp(event as MouseEvent);
  }

  private handleContextMenu(event: PointerEvent): void {}

  private handleMouseMove({ clientX, clientY }: MouseEvent): void {
    let state = this.keyStates['MouseXY'];
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;

    if (!state) {
      state = this.keyStates['MouseXY'] = new KeyState(new Vector3(x, y, 0), new Vector3(x, y, 0));
    } else {
      state.rawValue.x = x;
      state.rawValue.y = y;
      state.value.x = x;
      state.value.y = y;
    }

    state.sampleCount++;

    this.keysToConsume.add('MouseXY');
  }

  private handleMouseDown(event: MouseEvent): void {}

  private handleMouseUp(event: MouseEvent): void {}

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.code as TKey;
    let state = this.keyStates[key];

    if (!state) {
      state = this.keyStates[key] = new KeyState(new Vector3(1, 0, 0), new Vector3(1, 0, 0));
    }

    state.isPressed = true;
    state.sampleCount++;

    this.keysToConsume.add(key);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const state = this.keyStates[event.code as TKey];

    if (state) {
      state.isPressed = false;
    }
  }

  private getMappingContextIndex(mappingContext: InputMappingContext): number {
    return this.registeredInputContexts.findIndex(([registeredContext]) => registeredContext === mappingContext);
  }

  private consumeKey(key: TKey): void {
    const keyState = this.keyStates[key]!;

    if (!keyState.isPressed) {
      keyState.isConsumed = true;
      keyState.sampleCount = 0;

      this.keysToConsume.delete(key);
    }
  }
}

export class KeyState {
  /**
   * Stores how many times this key has been used since it's reset. The value
   * be set to "0" as soon as the key has been released or otherwise resetted.
   */
  public sampleCount: number = 0;

  constructor(
    /**
     * The unprocessed raw value.
     */
    public rawValue: Vector3,
    public value: Vector3,
    public isPressed: boolean = false,
    public isConsumed: boolean = false
  ) {}
}
