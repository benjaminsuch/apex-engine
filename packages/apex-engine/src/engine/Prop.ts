type ClassPropsMap = Map<string, Function[]>;

const propsMap = new WeakMap<TClass, ClassPropsMap>();

export function getPropsMap() {
  return propsMap;
}

export function PROP(...args: Function[]) {
  return function (target: any, prop: string | symbol) {
    const propKey = prop.toString();

    if (!propsMap.has(target.constructor)) {
      propsMap.set(target.constructor, new Map());
    }

    const classProps = propsMap.get(target.constructor) as ClassPropsMap;

    if (!classProps.has(propKey)) {
      classProps.set(propKey, []);
    }

    const fns = classProps.get(propKey);

    if (fns) {
      fns.push(...args);
    }

    Reflect.defineMetadata('position', classProps.size - 1, target.constructor, prop);
  };
}
