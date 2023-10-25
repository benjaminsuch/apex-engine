import { getClassSchema } from './class/class';
import { TripleBuffer } from './TripleBuffer';

export class SceneProxy {
  public static instances: Map<number, InstanceType<TClass>> = new Map();

  public static origins: Map<TClass, TClass> = new Map();

  constructor(public readonly id: number, tb: TripleBuffer) {
    console.log('SceneProxy', id, tb);
    const originClass = SceneProxy.origins.get(this.constructor as TClass);

    if (originClass) {
      const schema = getClassSchema(originClass);
      const offsets = [0];

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
}
