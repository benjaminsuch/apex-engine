import { setPropOnSchema } from '../class';

function setPropSize(constructor: TClass, prop: string | symbol, size: number) {
  setPropOnSchema(constructor, prop, 'size', size);
  Reflect.defineMetadata('size', size, constructor, prop);
}

function setPropType(
  constructor: TClass,
  prop: string | symbol,
  type: string,
  isArray: boolean = false
) {
  setPropOnSchema(constructor, prop, 'type', type);
  setPropOnSchema(constructor, prop, 'isArray', isArray);
  Reflect.defineMetadata('type', type, constructor, prop);
}

function createSerializer(type: string, size: number, isArray: boolean = false) {
  return (constructor: TClass, prop: string | symbol) => {
    setPropType(constructor, prop, type, isArray);
    setPropSize(constructor, prop, size);
  };
}

function getSize(size: number | [number]) {
  return Array.isArray(size) ? size[0] : size;
}

export function string(size: number) {
  return createSerializer('string', size);
}

export function float32(size: number | [number]) {
  return createSerializer(
    'float32',
    getSize(size) * Float32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function int8(size: number | [number]) {
  return createSerializer('int8', getSize(size), Array.isArray(size));
}

export function uint8(size: number | [number]) {
  return createSerializer('uint8', getSize(size), Array.isArray(size));
}

export function int16(size: number | [number]) {
  return createSerializer(
    'int16',
    getSize(size) * Int16Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function uint16(size: number | [number]) {
  return createSerializer(
    'uint16',
    getSize(size) * Uint16Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function int32(size: number | [number]) {
  return createSerializer(
    'int32',
    getSize(size) * Int32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function uint32(size: number | [number]) {
  return createSerializer(
    'uint32',
    getSize(size) * Uint32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function boolean() {
  return createSerializer('boolean', 1);
}

// Vectors are treated as a ref. Initially I wanted to handle them differently, by storing
// their values into the buffer, but that would require to create a new Vector everytime
// someone calls the getter-function. There are ways to work around that, but it would bloat
// up the code for little gains.
export function vec3() {
  return ref();
}

export function serialize(fn: Function, size: number | [number] = 1) {
  return (target: InstanceType<TClass>, prop: string | symbol) => {
    fn(size)(target.constructor, prop);
  };
}

export function ref() {
  return createSerializer('ref', Uint32Array.BYTES_PER_ELEMENT);
}
