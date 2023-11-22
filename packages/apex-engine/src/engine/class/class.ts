export type ClassDecoratorFunction = (constructor: TClass) => TClass;

export function CLASS(...classFns: ClassDecoratorFunction[]) {
  return function <T extends TClass>(constructor: T, ...rest: unknown[]) {
    console.log('CLASS:', constructor.name, rest);

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
      constructor = fn(constructor) as T;
    }

    console.log('schema', Reflect.getMetadata('schema', constructor));
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

export interface Schema {
  [key: string]: {
    isArray: boolean;
    pos: number;
    size: number;
    type: string;
  };
}

export function addPropToSchema(constructor: TClass, prop: string | symbol) {
  const key = prop.toString();
  let schema = Reflect.getMetadata('schema', constructor);

  if (!schema) {
    schema = {};
  }

  const keys = Object.keys(schema);
  const pos = keys.length;
  const prevKey = keys.find(val => schema[val].pos === pos - 1);
  const offset = prevKey ? schema[prevKey].offset + schema[prevKey].size : 0;

  schema[key] = { offset, pos, size: 0 };

  Reflect.defineMetadata('schema', schema, constructor);
}

export function getPropFromSchema(constructor: TClass, prop: string | symbol) {
  const schema = Reflect.getMetadata('schema', constructor);
  return schema[prop.toString()];
}

export function setPropOnSchema(
  constructor: TClass,
  prop: string | symbol,
  key: string,
  value: any
) {
  const schema = Reflect.getMetadata('schema', constructor);

  if (!schema) {
    console.warn(`No schema defined`);
    return;
  }

  schema[prop.toString()][key] = value;
}

export function getTargetId(target: InstanceType<TClass>): undefined | number {
  return Reflect.getMetadata('id', target);
}
