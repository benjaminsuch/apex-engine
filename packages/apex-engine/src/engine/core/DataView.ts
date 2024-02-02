type DataViewGetters = 'getFloat32' | 'getFloat64' | 'getInt8' | 'getInt16' | 'getInt32' | 'getUint8' | 'getUint16' | 'getUint32';

type GetDataViewGetter<T extends TypedArrayConstructor> = T extends typeof Float32Array
  ? 'getFloat32'
  : T extends typeof Int8Array
    ? 'getInt8'
    : T extends typeof Int16Array
      ? 'getInt16'
      : T extends typeof Int32Array
        ? 'getInt32'
        : T extends typeof Uint8Array
          ? 'getUint8'
          : T extends typeof Uint16Array
            ? 'getUint16'
            : T extends typeof Uint32Array
              ? 'getUint32'
              : T extends typeof Float64Array
                ? 'getFloat64'
                : never;

type DataViewSetters = 'setFloat32' | 'setFloat64' | 'setInt8' | 'setInt16' | 'setInt32' | 'setUint8' | 'setUint16' | 'setUint32';

type GetDataViewSetter<T extends TypedArrayConstructor> = T extends typeof Float32Array
  ? 'setFloat32'
  : T extends typeof Int8Array
    ? 'setInt8'
    : T extends typeof Int16Array
      ? 'setInt16'
      : T extends typeof Int32Array
        ? 'setInt32'
        : T extends typeof Uint8Array
          ? 'setUint8'
          : T extends typeof Uint16Array
            ? 'setUint16'
            : T extends typeof Uint32Array
              ? 'setUint32'
              : T extends typeof Float64Array
                ? 'setFloat64'
                : never;

declare interface DataViewConstructor {
  getTypedArrayGetter<T extends TypedArrayConstructor>(arr: T): GetDataViewGetter<T>;
  getTypedArraySetter<T extends TypedArrayConstructor>(arr: T): GetDataViewSetter<T>;
}

DataView.getTypedArrayGetter = function <T extends TypedArrayConstructor>(arr: T): GetDataViewGetter<T> {
  const getters = new Map<TypedArrayConstructor, DataViewGetters>([
    [Float32Array, 'getFloat32'],
    [Float64Array, 'getFloat64'],
    [Int8Array, 'getInt8'],
    [Int16Array, 'getInt16'],
    [Int32Array, 'getInt32'],
    [Uint8Array, 'getUint8'],
    [Uint16Array, 'getUint16'],
    [Uint32Array, 'getUint32'],
  ]);

  return getters.get(arr) as GetDataViewGetter<T>;
};

DataView.getTypedArraySetter = function <T extends TypedArrayConstructor>(arr: T): GetDataViewSetter<T> {
  const setters = new Map<TypedArrayConstructor, DataViewSetters>([
    [Float32Array, 'setFloat32'],
    [Float64Array, 'setFloat64'],
    [Int8Array, 'setInt8'],
    [Int16Array, 'setInt16'],
    [Int32Array, 'setInt32'],
    [Uint8Array, 'setUint8'],
    [Uint16Array, 'setUint16'],
    [Uint32Array, 'setUint32'],
  ]);

  return setters.get(arr) as GetDataViewSetter<T>;
};
