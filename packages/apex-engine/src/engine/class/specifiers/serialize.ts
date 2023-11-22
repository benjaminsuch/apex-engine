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

export function mat4() {
  return createSerializer('mat4', 16 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function quat() {
  return createSerializer('quat', 4 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function vec2() {
  return createSerializer('vec2', 2 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function vec3() {
  return createSerializer('vec3', 3 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function serialize(fn: Function, size: number | [number] = 1) {
  return (target: InstanceType<TClass>, prop: string | symbol) => {
    fn(size)(target.constructor, prop);
  };
}

export function ref() {
  return createSerializer('ref', Uint32Array.BYTES_PER_ELEMENT);
}
