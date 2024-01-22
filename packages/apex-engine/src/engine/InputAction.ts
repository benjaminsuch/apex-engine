import { Vector3 } from 'three';

import { type InputModifier } from './InputModifiers';
import { ETriggerEvent, ETriggerState, type InputTrigger } from './InputTriggers';
import { type PlayerInput } from './PlayerInput';

export class InputAction {
  protected triggerState: ETriggerState = ETriggerState.None;

  public readonly modifiers: InputModifier[] = [];

  public readonly triggers: InputTrigger[] = [];

  public value: Vector3;

  public consumeInput: boolean = true;

  constructor() {
    this.value = new Vector3(0, 0, 0);
  }

  public evaluateTriggers(playerInput: PlayerInput, triggers: InputTrigger[], value: Vector3, delta: number): ETriggerEvent {
    const lastTriggerState = this.triggerState;

    for (const trigger of triggers) {
      this.triggerState = trigger.run(playerInput, value, delta);
    }

    if (lastTriggerState === ETriggerState.None) {
      if (this.triggerState === ETriggerState.Ongoing) {
        return ETriggerEvent.Started;
      }
      if (this.triggerState === ETriggerState.Triggered) {
        return ETriggerEvent.Triggered;
      }
    }

    if (lastTriggerState === ETriggerState.Ongoing) {
      if (this.triggerState === ETriggerState.None) {
        return ETriggerEvent.Canceled;
      }
      if (this.triggerState === ETriggerState.Ongoing) {
        return ETriggerEvent.Ongoing;
      }
      if (this.triggerState === ETriggerState.Triggered) {
        return ETriggerEvent.Triggered;
      }
    }

    if (lastTriggerState === ETriggerState.Triggered) {
      if (this.triggerState === ETriggerState.Triggered) {
        return ETriggerEvent.Triggered;
      }
      if (this.triggerState === ETriggerState.Ongoing) {
        return ETriggerEvent.Ongoing;
      }
      if (this.triggerState === ETriggerState.None) {
        return ETriggerEvent.Completed;
      }
    }

    return ETriggerEvent.None;
  }
}
