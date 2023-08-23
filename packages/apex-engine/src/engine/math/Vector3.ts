import { Euler } from './Euler';
import { Matrix3 } from './Matrix3';
import { Matrix4 } from './Matrix4';

/**
 * Most of the code is from: https://github.com/mrdoob/three.js/blob/dev/src/math/Vector3.js
 *
 * It has been modified to store the values in a buffer which is meant to be shared across threads.
 */
export class Vector3 {
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

  public isVector3: boolean = true;

  constructor(buffer: ArrayBufferLike = new SharedArrayBuffer(3 * Float32Array.BYTES_PER_ELEMENT)) {
    this.#buffer = buffer;
    this.#data = new Float32Array(this.#buffer);

    const [x, y, z] = this.#data;

    this.#x = x;
    this.#y = y;
    this.#z = z;
  }

  public toJSON() {
    return this.#buffer;
  }

  public fromArray(array: ArrayLike<number>, offset = 0) {
    this.x = array[offset + 0];
    this.y = array[offset + 1];
    this.z = array[offset + 2];

    return this;
  }

  public toArray() {
    return Array.from(this.#data) as [number, number, number];
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

  public addScaledVector(vector: Vector3, scale: number) {
    this.x += vector.x * scale;
    this.y += vector.y * scale;
    this.z += vector.z * scale;

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

  public roundToZero() {
    this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x);
    this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y);
    this.z = this.z < 0 ? Math.ceil(this.z) : Math.floor(this.z);

    return this;
  }

  public negate() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;

    return this;
  }

  public dot(v: Vector3) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  public length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public setFromMatrixColumn(matrix: Matrix4, index: number) {
    return this.fromArray(matrix.elements, index * 4);
  }

  public setFromMatrix3Column(matrix: Matrix3, index: number) {
    return this.fromArray(matrix.elements, index * 3);
  }

  public setFromEuler(euler: Euler) {
    this.x = euler.x;
    this.y = euler.y;
    this.z = euler.z;

    return this;
  }

  public equals(vector: Vector3) {
    return vector.x === this.x && vector.y === this.y && vector.z === this.z;
  }

  public cross(vector: Vector3) {
    return this.crossVectors(this, vector);
  }

  public crossVectors(a: Vector3, b: Vector3) {
    const ax = a.x,
      ay = a.y,
      az = a.z;
    const bx = b.x,
      by = b.y,
      bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  }

  public random() {
    this.x = Math.random();
    this.y = Math.random();
    this.z = Math.random();

    return this;
  }

  public randomDirection() {
    // Derived from https://mathworld.wolfram.com/SpherePointPicking.html

    const u = (Math.random() - 0.5) * 2;
    const t = Math.random() * Math.PI * 2;
    const f = Math.sqrt(1 - u ** 2);

    this.x = f * Math.cos(t);
    this.y = f * Math.sin(t);
    this.z = u;

    return this;
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
  }
}
