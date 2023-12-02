//todo: Add description
//todo: Mention that only booleans, numbers, strings and arrays can be used as params
export function rpc(...args: any[]) {
  return (target: InstanceType<TClass>, prop: string | symbol, descriptor: PropertyDescriptor) => {
    if (typeof target[prop] !== 'function') {
      console.warn(
        `The rpc specifier expects prop (${prop.toString()}) to be a method, but it's of type "${typeof prop}".`
      );
      return;
    }

    const originalMethod = descriptor.value as unknown as (...args: unknown[]) => boolean;

    descriptor.value = function (this: typeof target, ...args: unknown[]) {
      const result = originalMethod.apply(this, args);

      if (result) {
        //todo: We have to include the tick information
        (this.proxyMessageChannel.port1 as MessagePort).postMessage({
          type: 'rpc',
          name: prop.toString(),
          //todo: We can only send booleans, numbers, strings and arrays of those.
          params: []
        });
      }
    };
  };
}
