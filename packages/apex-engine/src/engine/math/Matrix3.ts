import { Matrix4 } from './Matrix4';
import { Vector3 } from './Vector3';

/**
 * Most of the code is from: https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix3.js
 *
 * It has been modified to store the values in a buffer which is meant to be shared across threads.
 */
export class Matrix3 {
  readonly #buffer: ArrayBufferLike;

  #elements: Float32Array;

  get elements() {
    return this.#elements;
  }

  public isMatrix3: boolean = true;

  constructor(buffer: ArrayBufferLike = new SharedArrayBuffer(9 * Float32Array.BYTES_PER_ELEMENT)) {
    this.#buffer = buffer;
    this.#elements = new Float32Array(this.#buffer);
  }

  public set(
    n11: number,
    n12: number,
    n13: number,
    n21: number,
    n22: number,
    n23: number,
    n31: number,
    n32: number,
    n33: number
  ) {
    this.elements.set([n11, n12, n13, n21, n22, n23, n31, n32, n33]);
    return this;
  }

  public identity() {
    return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  public copy(matrix: Matrix3) {
    const el = matrix.elements;
    return this.set(el[0], el[1], el[2], el[3], el[4], el[5], el[6], el[7], el[8]);
  }

  public extractBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3) {
    xAxis.setFromMatrix3Column(this, 0);
    yAxis.setFromMatrix3Column(this, 1);
    zAxis.setFromMatrix3Column(this, 2);

    return this;
  }

  public setFromMatrix4(matrix: Matrix4) {
    const el = matrix.elements;
    return this.set(el[0], el[4], el[8], el[1], el[5], el[9], el[2], el[6], el[10]);
  }

  public multiply(matrix: Matrix3) {
    return this.multiplyMatrices(this, matrix);
  }

  public premultiply(matrix: Matrix3) {
    return this.multiplyMatrices(matrix, this);
  }

  public multiplyMatrices(a: Matrix3, b: Matrix3) {
    const ae = a.elements;
    const be = b.elements;
    const te = this.elements;

    te[0] = ae[0] * be[0] + ae[3] * be[1] + ae[6] * be[2];
    te[3] = ae[0] * be[3] + ae[3] * be[4] + ae[6] * be[5];
    te[6] = ae[0] * be[6] + ae[3] * be[7] + ae[6] * be[8];

    te[1] = ae[1] * be[0] + ae[4] * be[1] + ae[7] * be[2];
    te[4] = ae[1] * be[3] + ae[4] * be[4] + ae[7] * be[5];
    te[7] = ae[1] * be[6] + ae[4] * be[7] + ae[7] * be[8];

    te[2] = ae[2] * be[0] + ae[5] * be[1] + ae[8] * be[2];
    te[5] = ae[2] * be[3] + ae[5] * be[4] + ae[8] * be[5];
    te[8] = ae[2] * be[6] + ae[5] * be[7] + ae[8] * be[8];

    return this;
  }

  public multiplyScalar(scalar: number) {
    const te = this.elements;

    te[0] *= scalar;
    te[3] *= scalar;
    te[6] *= scalar;
    te[1] *= scalar;
    te[4] *= scalar;
    te[7] *= scalar;
    te[2] *= scalar;
    te[5] *= scalar;
    te[8] *= scalar;

    return this;
  }

  public determinant() {
    const te = this.elements;

    const a = te[0],
      b = te[1],
      c = te[2],
      d = te[3],
      e = te[4],
      f = te[5],
      g = te[6],
      h = te[7],
      i = te[8];

    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
  }

  public invert() {
    const te = this.elements,
      n11 = te[0],
      n21 = te[1],
      n31 = te[2],
      n12 = te[3],
      n22 = te[4],
      n32 = te[5],
      n13 = te[6],
      n23 = te[7],
      n33 = te[8],
      t11 = n33 * n22 - n32 * n23,
      t12 = n32 * n13 - n33 * n12,
      t13 = n23 * n12 - n22 * n13,
      det = n11 * t11 + n21 * t12 + n31 * t13;

    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] = (n31 * n23 - n33 * n21) * detInv;
    te[2] = (n32 * n21 - n31 * n22) * detInv;

    te[3] = t12 * detInv;
    te[4] = (n33 * n11 - n31 * n13) * detInv;
    te[5] = (n31 * n12 - n32 * n11) * detInv;

    te[6] = t13 * detInv;
    te[7] = (n21 * n13 - n23 * n11) * detInv;
    te[8] = (n22 * n11 - n21 * n12) * detInv;

    return this;
  }

  public transpose() {
    let tmp: number;
    const m = this.elements;

    tmp = m[1];
    m[1] = m[3];
    m[3] = tmp;

    tmp = m[2];
    m[2] = m[6];
    m[6] = tmp;

    tmp = m[5];
    m[5] = m[7];
    m[7] = tmp;

    return this;
  }

  public getNormalMatrix(matrix4: Matrix4) {
    return this.setFromMatrix4(matrix4).invert().transpose();
  }

  public transposeIntoArray(array: number[]) {
    const el = this.elements;

    array[0] = el[0];
    array[1] = el[3];
    array[2] = el[6];
    array[3] = el[1];
    array[4] = el[4];
    array[5] = el[7];
    array[6] = el[2];
    array[7] = el[5];
    array[8] = el[8];

    return this;
  }

  public setUvTransform(
    tx: number,
    ty: number,
    sx: number,
    sy: number,
    rotation: number,
    cx: number,
    cy: number
  ) {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);

    this.set(
      sx * c,
      sx * s,
      -sx * (c * cx + s * cy) + cx + tx,
      -sy * s,
      sy * c,
      -sy * (-s * cx + c * cy) + cy + ty,
      0,
      0,
      1
    );

    return this;
  }

  public scale(x: number, y: number) {
    this.premultiply(_m3.makeScale(x, y));

    return this;
  }

  public rotate(theta: number) {
    this.premultiply(_m3.makeRotation(-theta));

    return this;
  }

  public translate(x: number, y: number) {
    this.premultiply(_m3.makeTranslation(x, y));

    return this;
  }

  public makeTranslation(x: number, y: number) {
    this.set(1, 0, x, 0, 1, y, 0, 0, 1);

    return this;
  }

  public makeRotation(theta: number) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    this.set(c, -s, 0, s, c, 0, 0, 0, 1);

    return this;
  }

  public makeScale(x: number, y: number) {
    this.set(x, 0, 0, 0, y, 0, 0, 0, 1);

    return this;
  }

  public equals(matrix: Matrix3) {
    const te = this.elements;
    const me = matrix.elements;

    for (let i = 0; i < 9; i++) {
      if (te[i] !== me[i]) return false;
    }

    return true;
  }

  public fromArray(array: number[], offset = 0) {
    for (let i = 0; i < 9; i++) {
      this.elements[i] = array[i + offset];
    }
    return this;
  }

  public toArray(array: number[] = [], offset = 0) {
    for (let i = 0; i < this.elements.length; i++) {
      array[offset + i] = this.elements[i];
    }
    return array;
  }

  public clone() {
    return new Matrix3().fromArray(Array.from(this.elements));
  }
}

const _m3 = /*@__PURE__*/ new Matrix3();
