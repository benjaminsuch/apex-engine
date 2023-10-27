import { type TripleBuffer } from '../platform/memory/common';
import { originClassMap } from './proxy.config';

interface Schema {
  [key: string]: {
    isArray: boolean;
    pos: number;
    size: number;
    type: string;
  };
}

export class SceneProxy {
  public static instances: Map<number, InstanceType<TClass>> = new Map();

  constructor(origin: string, public readonly id: number, tb: TripleBuffer) {
    console.log('SceneProxy', id, tb);
    const OriginClass = originClassMap.get(origin);

    if (!OriginClass) {
      throw new Error(`Class for origin "${origin}" not found.`);
    }

    const schema: Schema | undefined = Reflect.getMetadata('schema', OriginClass);
    const offsets = [0];

    if (!schema) {
      console.warn(`No schema for proxy defined.`);
      return;
    }

    for (const [prop, { type, isArray, pos, size }] of Object.entries(schema)) {
      let accessors: { get: () => any } | undefined;

      switch (type) {
        case 'ref':
          accessors = {
            get() {
              const dv = new DataView(tb.getReadBuffer());
              return SceneProxy.instances.get(dv.getUint32(offsets[pos]));
            }
          };
          break;
        case 'uint8':
          accessors = {
            get() {
              const dv = new DataView(tb.getReadBuffer());

              if (isArray) {
                return new Uint8Array(tb.getReadBuffer(), offsets[pos], size);
              } else {
                return dv.getUint8(offsets[pos]);
              }
            }
          };
          break;
      }

      offsets.push(size);

      if (accessors) {
        Object.defineProperties(this, { [prop]: accessors });
      }
    }
  }
}
