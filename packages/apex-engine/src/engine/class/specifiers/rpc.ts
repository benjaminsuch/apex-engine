import { GameProxyManager, GameRPCTask } from '../../ProxyManager';
import { type IProxy } from './proxy';

//todo: Add description
//todo: Mention that only booleans, numbers, strings and arrays can be used as params
export function rpc(...args: any[]) {
  return (target: IProxy, prop: string | symbol, descriptor: PropertyDescriptor) => {
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
        GameProxyManager.getInstance().queueTask(
          GameRPCTask,
          {
            name: prop.toString(),
            //todo: We can only send booleans, numbers, strings and arrays of those.
            params: []
          },
          this
        );
      }
    };
  };
}
