import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { type InputAction } from './InputAction';
import { type InputModifier } from './InputModifiers';
import { type InputTrigger } from './InputTriggers';

export class InputMappingContext {
  public mappings: ActionKeyMapping[] = [];

  constructor(@IInstantiationService protected readonly instantiationService: IInstantiationService) {}

  public mapKey(action: InputAction, key: TKey): ActionKeyMapping {
    const idx = this.mappings.push(this.instantiationService.createInstance(ActionKeyMapping, action, key));
    return this.mappings[idx - 1];
  }

  public unmapKey(action: InputAction, key: TKey): void {
    const idx = this.mappings.findIndex(mapping => mapping.action === action && mapping.key === key);

    if (idx > -1) {
      this.mappings.splice(idx, 1, this.mappings[this.mappings.length - 1]).pop();
    }
  }
}

export class ActionKeyMapping {
  public readonly modifiers: InputModifier[] = [];

  public readonly triggers: InputTrigger[] = [];

  constructor(public readonly action: InputAction, public readonly key: TKey) {}
}
