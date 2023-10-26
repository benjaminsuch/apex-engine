import { TripleBuffer } from '../../platform/memory/common/TripleBuffer';

export type ClassDecoratorFunction = (constructor: TClass) => boolean;

let classId = 0;

export function id(target: InstanceType<TClass>) {
  let id = Reflect.getMetadata('id', target);

  if (!id) {
    id = ++classId;
    Reflect.defineMetadata('id', id, target);
  }

  return id;
}

export function CLASS(...classFns: ClassDecoratorFunction[]) {
  return function <T extends TClass>(constructor: T, ...rest: unknown[]) {
    console.log('CLASS:', constructor.name, rest);

    Reflect.defineMetadata('specifiers', new Map<string, Function>([['id', id]]), constructor);

    if (!Reflect.getMetadata('schema', constructor)) {
      Reflect.defineMetadata('schema', {}, constructor);
    }

    const schema = Reflect.getMetadata('schema', constructor);
    let byteLength = 0;

    for (const config of Object.values(schema)) {
      byteLength += (config as any).size;
    }

    Reflect.defineMetadata('byteLength', byteLength, constructor);

    for (const fn of classFns) {
      if (!fn(constructor)) {
        console.error(`An error occured during one of the class specifiers (${fn.name}).`);
      }
    }

    const originalInit: Function | undefined = constructor.prototype.init;

    Object.defineProperties(constructor.prototype, {
      init: {
        value(this: any, ...args: any[]) {
          const specifiers = getClassSpecifiers(constructor);

          for (const [, specifier] of specifiers) {
            specifier(this);
          }

          originalInit?.call(this, ...args);
        }
      }
    });

    return constructor;
  };
}

export function PROP(...args: Function[]) {
  return function (target: InstanceType<TClass>, prop: string | symbol) {
    addPropToSchema(target.constructor, prop);

    for (const fn of args) {
      fn(target, prop);
    }

    console.log('PROP:', prop);
  };
}

export type ClassSpecifierFunction = (target: InstanceType<TClass>) => any;

export interface Schema {
  [key: string]: {
    isArray: boolean;
    pos: number;
    size: number;
    type: string;
  };
}

export function getClassSpecifiers(constructor: TClass): Map<string, ClassSpecifierFunction> {
  return Reflect.getMetadata('specifiers', constructor) ?? new Map();
}

export function getTripleBuffer(target: InstanceType<TClass>): TripleBuffer | undefined {
  return Reflect.getMetadata('buffer', target);
}

export function setTripleBuffer(target: InstanceType<TClass>, buffer: TripleBuffer) {
  Reflect.defineMetadata('buffer', buffer, target);
}

export function getClassSchema(constructor: TClass): Schema | undefined {
  return Reflect.getMetadata('schema', constructor);
}

export function addPropToSchema(constructor: TClass, prop: string | symbol) {
  const key = prop.toString();
  let schema = getClassSchema(constructor);

  if (!schema) {
    schema = {};
  }

  const pos = Object.keys(schema).length;

  schema[key] = { isArray: false, pos, size: 0, type: 'uint8' };

  Reflect.defineMetadata('schema', schema, constructor);
}

export function getPropFromSchema(constructor: TClass, prop: string | symbol) {
  const schema = getClassSchema(constructor);

  if (!schema) {
    throw new Error(`The class has no schema defined.`);
  }

  return schema[prop.toString()];
}

export function setPropOnSchema(
  constructor: TClass,
  prop: string | symbol,
  key: string,
  value: any
) {
  const schema = getClassSchema(constructor);

  if (!schema) {
    console.warn(`No schema defined`);
    return;
  }

  schema[prop.toString()][key] = value;
}

export function getTargetId(target: InstanceType<TClass>): undefined | number {
  return Reflect.getMetadata('id', target);
}
