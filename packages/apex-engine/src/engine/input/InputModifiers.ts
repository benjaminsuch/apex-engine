import { Vector3 } from 'three';

export abstract class InputModifier {
  public abstract modify(value: Vector3, delta: number): Vector3;
}

/**
 * Determines the order in which the values are swapped:
 *
 * - YXZ: Swap X and Y
 * - ZYX: Swap X and Z
 * - XZY: Swap Y and Z
 */
export enum EInputAxisSwizzleOrder {
  YXZ,
  ZYX,
  XZY,
}

export class InputModifierSwizzleAxis extends InputModifier {
  constructor(public order: EInputAxisSwizzleOrder = EInputAxisSwizzleOrder.YXZ) {
    super();
  }

  public override modify(value: Vector3): Vector3 {
    switch (this.order) {
      case EInputAxisSwizzleOrder.YXZ: {
        const x = value.x;

        value.x = value.y;
        value.y = x;

        return value;
      }
      case EInputAxisSwizzleOrder.ZYX: {
        const x = value.x;

        value.x = value.z;
        value.z = x;

        return value;
      }
      case EInputAxisSwizzleOrder.XZY: {
        const y = value.y;

        value.y = value.z;
        value.z = y;

        return value;
      }
    }
  }
}

export class InputModifierNegate extends InputModifier {
  public override modify(value: Vector3): Vector3 {
    return value.multiply(new Vector3(value.x > 0 ? -1 : 1, value.y > 0 ? -1 : 1, value.z > 0 ? -1 : 1));
  }
}

export class InputModifierScalar extends InputModifier {
  constructor(public scalar: number) {
    super();
  }

  public override modify(value: Vector3): Vector3 {
    return value.multiplyScalar(this.scalar);
  }
}

export class InputModifierScalarByDelta extends InputModifier {
  public override modify(value: Vector3, delta: number): Vector3 {
    return value.multiplyScalar(delta);
  }
}
