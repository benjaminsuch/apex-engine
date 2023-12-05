import { setPropOnSchema } from '../class';

function setPropSize(constructor: TClass, prop: string | symbol, size: number) {
  setPropOnSchema(constructor, prop, 'size', size);
  Reflect.defineMetadata('size', size, constructor, prop);
}

function setPropType(
  constructor: TClass,
  prop: string | symbol,
  type: string,
  arrayType: TypedArray,
  isArray: boolean = false
) {
  setPropOnSchema(constructor, prop, 'arrayType', arrayType);
  setPropOnSchema(constructor, prop, 'type', type);
  setPropOnSchema(constructor, prop, 'isArray', isArray);
  Reflect.defineMetadata('type', type, constructor, prop);
}

function createSerializer(
  type: string,
  arrayType: TypedArray,
  size: number,
  isArray: boolean = false
) {
  return (constructor: TClass, prop: string | symbol) => {
    setPropType(constructor, prop, type, arrayType, isArray);
    setPropSize(constructor, prop, size);
  };
}

function getSize(size: number | [number]) {
  return Array.isArray(size) ? size[0] : size;
}

export function string(size: number) {
  return createSerializer('string', Uint8Array, size);
}

export function float32(size: number | [number]) {
  return createSerializer(
    'float32',
    Float32Array,
    getSize(size) * Float32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function int8(size: number | [number]) {
  return createSerializer('int8', Int8Array, getSize(size), Array.isArray(size));
}

export function uint8(size: number | [number]) {
  return createSerializer('uint8', Uint8Array, getSize(size), Array.isArray(size));
}

export function int16(size: number | [number]) {
  return createSerializer(
    'int16',
    Int16Array,
    getSize(size) * Int16Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function uint16(size: number | [number]) {
  return createSerializer(
    'uint16',
    Uint16Array,
    getSize(size) * Uint16Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function int32(size: number | [number]) {
  return createSerializer(
    'int32',
    Int32Array,
    getSize(size) * Int32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function uint32(size: number | [number]) {
  return createSerializer(
    'uint32',
    Uint32Array,
    getSize(size) * Uint32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function boolean() {
  return createSerializer('boolean', Uint8Array, 1);
}

export function mat4() {
  return createSerializer('mat4', Float32Array, 16 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function quat() {
  return createSerializer('quat', Float32Array, 4 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function vec2() {
  return createSerializer('vec2', Float32Array, 2 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function vec3() {
  return createSerializer('vec3', Float32Array, 3 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function serialize(fn: Function, size: number | [number] = 1) {
  return (target: InstanceType<TClass>, prop: string | symbol) => {
    fn(size)(target.constructor, prop);
  };
}

export function ref() {
  return createSerializer('ref', Uint32Array, Uint32Array.BYTES_PER_ELEMENT);
}
