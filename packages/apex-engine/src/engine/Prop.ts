export function PROP(...args: Function[]) {
  return function (target: any, prop: string | symbol) {
    const key = prop.toString();
    const props: string[] = Reflect.getMetadata('class:props', target.constructor) ?? [];

    if (props.indexOf(key) === -1) {
      Reflect.defineMetadata('class:props', props.concat(key), target.constructor);
    }

    for (const fn of args) {
      fn(target.constructor, prop);
    }
  };
}
