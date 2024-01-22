import { type Vector3 } from 'three';

export abstract class InputModifier {
  public abstract modify(value: Vector3): Vector3;
}
