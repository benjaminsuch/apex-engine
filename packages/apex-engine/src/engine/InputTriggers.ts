import { type Vector3 } from 'three';

import { type PlayerInput } from './PlayerInput';

export enum ETriggerEvent {
  None,
  Triggered,
  Started,
  Ongoing,
  Canceled,
  Completed,
}

export enum ETriggerState {
  None,
  Triggered,
  Ongoing,
}

export abstract class InputTrigger {
  public abstract run(playerInput: PlayerInput, value: Vector3, delta: number): ETriggerState;
}
