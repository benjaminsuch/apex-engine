import { EventDispatcher, Vector3 } from 'three';

import { type InputModifier } from './InputModifiers';
import { type InputTrigger } from './InputTriggers';

export class InputAction extends EventDispatcher {
  protected readonly modifiers: InputModifier[] = [];

  protected readonly triggers: InputTrigger[] = [];

  protected readonly value: Vector3;

  constructor() {
    super();

    this.value = new Vector3(0, 0, 0);
  }
}
