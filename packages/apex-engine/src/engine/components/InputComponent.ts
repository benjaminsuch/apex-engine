import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { type Actor } from '../Actor';
import { type InputAction } from '../input/InputAction';
import { type ETriggerEvent } from '../input/InputTriggers';
import { ActorComponent } from './ActorComponent';

export class InputComponent extends ActorComponent {
  public readonly actionBindings: InputActionBinding[] = [];

  public bindAction<T extends Actor>(action: InputAction, event: ETriggerEvent, target: T, handler: Function): InputActionBinding {
    const binding = this.instantiationService.createInstance(InputActionBinding, this, action, event);

    binding.bind(target, handler);
    this.actionBindings.push(binding);

    return binding;
  }

  public unbindAction(action: InputAction): void {
    const idx = this.actionBindings.findIndex(binding => binding.action === action);

    if (idx > -1) {
      this.actionBindings.splice(idx, 1, this.actionBindings[this.actionBindings.length - 1]).pop();
    }
  }
}

export class InputActionBinding {
  private actionHandler: (() => void) | undefined;

  constructor(
    private readonly inputComponent: InputComponent,
    public readonly action: InputAction,
    public readonly triggerEvent: ETriggerEvent,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public exec(): void {
    if (!this.actionHandler) {
      this.logger.warn(this.constructor.name, `Execution skipped: No action-handler was assigned.`);
      return;
    }

    this.actionHandler();
  }

  public bind<T extends Actor>(target: T, handler: Function, replace: boolean = false): void {
    if (this.actionHandler) {
      if (!replace) {
        this.logger.warn(`Binding aborted: An action-handler is already bound to action "${this.action.constructor.name}". Set "replace" to "true" if this is intended.`);
        return;
      }

      this.unbind();
    }

    this.actionHandler = (): void => handler.call(target, this.action.value);
  }

  public unbind(): void {
    this.actionHandler = undefined;
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
