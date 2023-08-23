import { MathUtils } from 'three';

import { Matrix4 } from './Matrix4';
import { type Quaternion } from './Quaternion';

const _matrix = new Matrix4();

/**
 * Most of the code is from: https://github.com/mrdoob/three.js/blob/dev/src/math/Euler.js
 *
 * It has been modified to store the values in a buffer which is meant to be shared across threads.
 */
export class Euler {
  public static readonly ORDER_LIST = ['XYZ', 'XZY', 'YZX', 'YXZ', 'ZXY', 'ZYX'] as const;

  public static readonly DEFAULT_ORDER = 'XYZ';

  readonly #buffer: ArrayBufferLike;

  readonly #data: Float32Array;

  #x: number = 0;

  get x() {
    return this.#data[0];
  }

  set x(val) {
    this.#data.set([val]);
    this.#x = this.#data[0];
  }

  #y: number = 0;

  get y() {
    return this.#data[1];
  }

  set y(val) {
    this.#data.set([val], 1);
    this.#y = this.#data[1];
  }

  #z: number = 0;

  get z() {
    return this.#data[2];
  }

  set z(val) {
    this.#data.set([val], 2);
    this.#z = this.#data[2];
  }

  #order: 'XYZ' | 'XZY' | 'YZX' | 'YXZ' | 'ZXY' | 'ZYX' = 'XYZ';

  get order() {
    return this.#order;
  }

  set order(val) {
    this.#data.set([Euler.ORDER_LIST.indexOf(val)], 3);
    this.#order = val;
  }

  public isEuler: boolean = true;

  constructor(buffer: ArrayBufferLike = new SharedArrayBuffer(4 * Float32Array.BYTES_PER_ELEMENT)) {
    this.#buffer = buffer;
    this.#data = new Float32Array(this.#buffer);

    const [x, y, z, order] = this.#data;

    this.#x = x;
    this.#y = y;
    this.#z = z;
    this.#order = Euler.ORDER_LIST[order];
  }

  public set(x: Euler['x'], y: Euler['y'], z: Euler['z'], order: Euler['order']) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;

    return this;
  }

  public clone() {
    return new Euler().set(this.x, this.y, this.z, this.order);
  }

  public copy(euler: Euler) {
    this.x = euler.x;
    this.y = euler.y;
    this.z = euler.z;
    this.order = euler.order;

    return this;
  }

  public setFromRotationMatrix(matrix: Matrix4, order: Euler['order']) {
    const te = matrix.elements;
    const m11 = te[0],
      m12 = te[4],
      m13 = te[8];
    const m21 = te[1],
      m22 = te[5],
      m23 = te[9];
    const m31 = te[2],
      m32 = te[6],
      m33 = te[10];

    switch (order) {
      case 'XYZ':
        this.y = Math.asin(MathUtils.clamp(m13, -1, 1));

        if (Math.abs(m13) < 0.9999999) {
          this.x = Math.atan2(0 - m23, m33);
          this.z = Math.atan2(0 - m12, m11);
        } else {
          this.x = Math.atan2(m32, m22);
          this.z = 0;
        }

        break;

      case 'YXZ':
        this.x = Math.asin(0 - MathUtils.clamp(m23, -1, 1));

        if (Math.abs(m23) < 0.9999999) {
          this.y = Math.atan2(m13, m33);
          this.z = Math.atan2(m21, m22);
        } else {
          this.y = Math.atan2(0 - m31, m11);
          this.z = 0;
        }

        break;

      case 'ZXY':
        this.x = Math.asin(MathUtils.clamp(m32, -1, 1));

        if (Math.abs(m32) < 0.9999999) {
          this.y = Math.atan2(0 - m31, m33);
          this.z = Math.atan2(0 - m12, m22);
        } else {
          this.y = 0;
          this.z = Math.atan2(m21, m11);
        }

        break;

      case 'ZYX':
        this.y = Math.asin(0 - MathUtils.clamp(m31, -1, 1));

        if (Math.abs(m31) < 0.9999999) {
          this.x = Math.atan2(m32, m33);
          this.z = Math.atan2(m21, m11);
        } else {
          this.x = 0;
          this.z = Math.atan2(0 - m12, m22);
        }

        break;

      case 'YZX':
        this.z = Math.asin(MathUtils.clamp(m21, -1, 1));

        if (Math.abs(m21) < 0.9999999) {
          this.x = Math.atan2(0 - m23, m22);
          this.y = Math.atan2(0 - m31, m11);
        } else {
          this.x = 0;
          this.y = Math.atan2(m13, m33);
        }

        break;

      case 'XZY':
        this.z = Math.asin(0 - MathUtils.clamp(m12, -1, 1));

        if (Math.abs(m12) < 0.9999999) {
          this.x = Math.atan2(m32, m22);
          this.y = Math.atan2(m13, m11);
        } else {
          this.x = Math.atan2(0 - m23, m33);
          this.y = 0;
        }

        break;

      default:
        console.warn(
          'THREE.Euler: .setFromRotationMatrix() encountered an unknown order: ' + order
        );
    }

    this.order = order;

    return this;
  }

  public setFromQuaternion(quat: Quaternion, order: Euler['order'] = this.order) {
    return this.setFromRotationMatrix(_matrix.makeRotationFromQuaternion(quat), order);
  }

  public setFromVector3() {}

  public reorder() {}

  public equals(euler: Euler) {
    return (
      euler.x === this.x && euler.y === this.y && euler.z === this.z && euler.order === this.order
    );
  }

  public fromArray(array: number[]) {
    this.x = array[0];
    this.y = array[1];
    this.z = array[2];
    this.order = array[3] ? Euler.ORDER_LIST[array[3]] : Euler.DEFAULT_ORDER;

    return this;
  }

  public toArray(array: number[] = [], offset = 0) {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    array[offset + 3] = Euler.ORDER_LIST.indexOf(this.order);

    return array;
  }

  public toJSON() {
    return this.#buffer;
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
    yield this.order;
  }
}
