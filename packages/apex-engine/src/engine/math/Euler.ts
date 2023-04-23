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
    this.#data.set([this.#data[0], val]);
    this.#y = this.#data[1];
  }

  #z: number = 0;

  get z() {
    return this.#data[2];
  }

  set z(val) {
    this.#data.set([this.#data[0], this.#data[1], val]);
    this.#z = this.#data[2];
  }

  #order: 'XYZ' | 'XZY' | 'YZX' | 'YXZ' | 'ZXY' | 'ZYX' = 'XYZ';

  get order() {
    return this.#order;
  }

  set order(val) {
    this.#data.set([this.#data[0], this.#data[1], this.#data[2], Euler.ORDER_LIST.indexOf(val)]);
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

  public setFromRotationMatrix() {}

  public setFromQuaternion() {}

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
