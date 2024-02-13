import { getClassSchema, isPropSchema } from './core/class/decorators';
import { type EProxyThread } from './core/class/specifiers/proxy';
import { TripleBuffer } from './core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from './EngineLoop';
import { ProxyManager } from './ProxyManager';

export abstract class ProxyInstance {
  public name: string = '';

  public readonly isProxy: boolean = true;

  constructor(
    args: unknown[] = [],
    tb: TripleBuffer,
    public readonly id: number,
    public readonly originThread: EProxyThread
  ) {
    const originClass = Reflect.getMetadata('proxy:origin', this.constructor);
    const schema = getClassSchema(originClass);

    if (!schema) {
      console.warn(`Unable to find the schema for "${originClass.name}".`);
      return;
    }

    const views = [new DataView(tb.buffers[0]), new DataView(tb.buffers[1]), new DataView(tb.buffers[2])];

    for (const key in schema) {
      const propSchema = schema[key];

      if (isPropSchema(propSchema)) {
        const { arrayType, isArray, offset, size, type } = propSchema;

        let accessors: { get: (this: ProxyInstance) => any } | undefined;

        if (type === 'string') {
        } else if (type === 'ref') {
          accessors = {
            get(this): ProxyInstance | void {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              console.log('ref val', idx, offset, views[idx].getUint32(offset, true), ProxyManager.getInstance());
              return ProxyManager.getInstance().getProxy(views[idx].getUint32(offset, true), originThread)?.target;
            },
          };
        } else if (type === 'boolean') {
          accessors = {
            get(this): boolean {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              return Boolean(views[idx].getUint8(offset));
            },
          };
        } else {
          accessors = {
            get(this): number | number[] {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              const getter = DataView.getTypedArrayGetter(arrayType);

              if (isArray) {
                const arr: number[] = [];

                for (let i = 0; i < size / arrayType.BYTES_PER_ELEMENT; ++i) {
                  // @ts-ignore
                  arr.push(views[idx][getter](offset + i * arrayType.BYTES_PER_ELEMENT, true));
                }

                return arr;
              } else {
                // @ts-ignore
                return views[idx][getter](offset, true);
              }
            },
          };
        }

        if (accessors) {
          Object.defineProperty(this, key, accessors);
        }
      }
    }
  }

  public tick(tick: IEngineLoopTickContext): Promise<void> | void {}
}
