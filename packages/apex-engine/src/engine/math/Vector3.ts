/**
 * Most of the code is from: https://github.com/mrdoob/three.js/blob/dev/src/math/Vector3.js
 *
 * It has been modified to store the values in a buffer which is meant to be shared across threads.
 */
export class Vector3 {
  readonly #buffer: ArrayBufferLike;

  private readonly data: Float32Array;

  #x: number = 0;

  get x() {
    return this.data[0];
  }

  set x(val) {
    this.data.set([val]);
    this.#x = this.data[0];
  }

  #y: number = 0;

  get y() {
    return this.data[1];
  }

  set y(val) {
    this.data.set([this.data[0], val]);
    this.#y = this.data[1];
  }

  #z: number = 0;

  get z() {
    return this.data[2];
  }

  set z(val) {
    this.data.set([this.data[0], this.data[1], val]);
    this.#z = this.data[2];
  }

  constructor(buffer: ArrayBufferLike = new SharedArrayBuffer(3 * Float32Array.BYTES_PER_ELEMENT)) {
    this.#buffer = buffer;
    this.data = new Float32Array(this.#buffer);
  }

  public toJSON() {
    return this.#buffer;
  }

  public fromArray(array: ArrayLike<number>) {
    this.data.set(array);
    return this;
  }

  public toArray() {
    return Array.from(this.data) as [number, number, number];
  }

  public set(x: Vector3['x'], y: Vector3['y'], z: Vector3['z']) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  }

  public setX(x: Vector3['x']) {
    this.x = x;

    return this;
  }

  public setY(y: Vector3['y']) {
    this.y = y;

    return this;
  }

  public setZ(z: Vector3['z']) {
    this.z = z;

    return this;
  }

  public clone() {
    return new Vector3().set(this.x, this.y, this.z);
  }

  public copy(vec: Vector3) {
    this.x = vec.x;
    this.y = vec.y;
    this.z = vec.z;

    return this;
  }

  public add(vec: Vector3) {
    this.x += vec.x;
    this.y += vec.y;
    this.z += vec.z;

    return this;
  }

  public addScalar(val: number) {
    this.x += val;
    this.y += val;
    this.z += val;

    return this;
  }

  public addVectors(a: Vector3, b: Vector3) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;

    return this;
  }

  public sub(vec: Vector3) {
    this.x -= vec.x;
    this.y -= vec.y;
    this.z -= vec.z;

    return this;
  }

  public subScalar(val: number) {
    this.x -= val;
    this.y -= val;
    this.z -= val;

    return this;
  }

  public multiply(vec: Vector3) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;

    return this;
  }

  public multiplyScalar(val: number) {
    this.x *= val;
    this.y *= val;
    this.z *= val;

    return this;
  }

  public multiplyVectors(a: Vector3, b: Vector3) {
    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;

    return this;
  }

  public divide(vec: Vector3) {
    this.x /= vec.x;
    this.y /= vec.y;
    this.z /= vec.z;

    return this;
  }

  public divideScalar(val: number) {
    return this.multiplyScalar(1 / val);
  }

  public clamp(min: Vector3, max: Vector3) {
    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));
    this.z = Math.max(min.z, Math.min(max.z, this.z));

    return this;
  }

  public clampScalar(min: number, max: number) {
    this.x = Math.max(min, Math.min(max, this.x));
    this.y = Math.max(min, Math.min(max, this.y));
    this.z = Math.max(min, Math.min(max, this.z));

    return this;
  }

  public ceil() {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    this.z = Math.ceil(this.z);

    return this;
  }

  public floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.z = Math.floor(this.z);

    return this;
  }

  public round() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);

    return this;
  }

  public length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
  }
}
