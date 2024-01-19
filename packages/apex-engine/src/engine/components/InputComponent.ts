import { type EventDispatcher } from 'three';

import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { type Actor } from '../Actor';
import { type InputAction } from '../InputAction';
import { ETriggerEvent } from '../InputTriggers';
import { ActorComponent } from './ActorComponent';

export class InputComponent extends ActorComponent {
  public readonly actionBindings: InputActionBinding[] = [];

  public bindAction<T extends Actor>(ActionConstructor: typeof InputAction, event: ETriggerEvent, target: T, handler: Function): InputActionBinding {
    const action = this.instantiationService.createInstance(ActionConstructor);
    const binding = this.instantiationService.createInstance(InputActionBinding, this, action, event);

    binding.bind(target, handler);
    this.actionBindings.push(binding);

    return binding;
  }
}

export class InputActionBinding {
  private listener: Parameters<EventDispatcher['addEventListener']>[1] | undefined;

  constructor(
    private readonly inputComponent: InputComponent,
    private readonly action: InputAction,
    private readonly event: ETriggerEvent,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public bind<T extends Actor>(target: T, handler: Function, replace: boolean = false): void {
    if (this.listener) {
      if (!replace) {
        this.logger.warn(`Binding aborted: An action-handler is already bound to action "${this.action.constructor.name}". Set "replace" to "true" if this is intended.`);
        return;
      }

      this.unbind();
    }

    this.listener = (event): void => handler.call(target, event);
    this.action.addEventListener(ETriggerEvent[this.event], this.listener);
  }

  public unbind(): void {
    if (this.listener) {
      this.action.removeEventListener(ETriggerEvent[this.event], this.listener);
      this.listener = undefined;
    }
  }

  public destroy(): void {
    const bindings = this.inputComponent.actionBindings;
    const idx = bindings.findIndex(binding => binding === this);

    if (idx > -1) {
      this.inputComponent.actionBindings.splice(idx, 1, bindings[bindings.length - 1]).pop();
      this.unbind();
    }
  }
}
