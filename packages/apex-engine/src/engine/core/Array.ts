declare interface ArrayConstructor {
  TYPED_ARRAY_CONSTRUCTORS: {
    BigInt64Array: typeof BigInt64Array;
    BigUint64Array: typeof BigUint64Array;
    Float32Array: typeof Float32Array;
    Float64Array: typeof Float64Array;
    Int16Array: typeof Int16Array;
    Int32Array: typeof Int32Array;
    Int8Array: typeof Int8Array;
    Uint16Array: typeof Uint16Array;
    Uint32Array: typeof Uint32Array;
    Uint8Array: typeof Uint8Array;
    Uint8ClampedArray: typeof Uint8ClampedArray;
  };

  isBigInt64Array(ctor: TypedArrayConstructor): ctor is typeof BigInt64Array;

  isBigUint64Array(ctor: TypedArrayConstructor): ctor is typeof BigUint64Array;
}

declare interface Array<T> {
  /**
   * Removes the item at `idx`.
   *
   * This method is way more performant than using `splice`. It swaps the item at `idx`
   * with the last item and then calls `pop` to remove it. Doing so will prevent the
   * compiler to re-arrange the array.
   */
  removeAtSwap(idx: number): void;

  /**
   * __If you just want to delete an item, we highly suggest you use `.remoteAtSwap` instead.__
   *
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   *
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @param items Elements to insert into the array in place of the deleted elements.
   * @returns An array containing the elements that were deleted.
   */
  splice(start: number, deleteCount: number, ...items: T[]): T[];
}

Array.prototype.removeAtSwap = function (this: Array<unknown>, idx): void {
  this.splice(idx, 1, this[this.length - 1]);
  this.pop();
};

Array.TYPED_ARRAY_CONSTRUCTORS = {
  BigInt64Array,
  BigUint64Array,
  Float32Array,
  Float64Array,
  Int16Array,
  Int32Array,
  Int8Array,
  Uint16Array,
  Uint32Array,
  Uint8Array,
  Uint8ClampedArray,
} as const;

Array.isBigInt64Array = function (this: Array<unknown>, ctor): ctor is typeof BigInt64Array {
  return ctor === BigInt64Array;
};

Array.isBigUint64Array = function (this: Array<unknown>, ctor): ctor is typeof BigUint64Array {
  return ctor === BigUint64Array;
};
