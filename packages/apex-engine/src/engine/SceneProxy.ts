import { Object3D } from 'three';

import { TripleBuffer } from '../platform/memory/common';
import { getClassSchema } from './class';

export abstract class SceneProxy {
  declare position: [number, number, number];

  declare rotation: [number, number, number];

  declare scale: [number, number, number];

  declare matrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ];

  declare quaternion: [number, number, number, number];

  declare up: [number, number, number];

  declare visible: boolean;

  declare castShadow: boolean;

  declare receiveShadow: boolean;

  public sceneObject: Object3D = new Object3D();

  constructor(public readonly id: number, tb: TripleBuffer) {
    const originClass = Reflect.getMetadata('proxy:origin', this.constructor);
    const schema = getClassSchema(originClass);

    if (!schema) {
      console.warn(`Unable to find the schema for "${originClass.name}".`);
      return;
    }

    for (const key in schema) {
      const { arrayType, offset, type } = schema[key];
      // Typed arrays expect the size to not be in bytes
      const size = schema[key].size / arrayType.BYTES_PER_ELEMENT;

      Reflect.defineMetadata(
        'buffers',
        [
          new arrayType(tb.buffers[0], offset, size),
          new arrayType(tb.buffers[1], offset, size),
          new arrayType(tb.buffers[2], offset, size)
        ],
        this,
        key
      );

      let accessors: { get: (this: SceneProxy) => any } | undefined;

      if (type === 'string') {
      } else if (type === 'ref') {
      } else if (type === 'boolean') {
        accessors = {
          get(this) {
            const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
            const data = Reflect.getMetadata('buffers', this, key);

            return Boolean(data[idx][0]);
          }
        };
      } else {
        accessors = {
          get(this) {
            const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
            const data = Reflect.getMetadata('buffers', this, key);

            if (data) {
              return data[idx];
            } else {
              return data[idx][0];
            }
          }
        };
      }

      if (accessors) {
        Object.defineProperty(this, key, accessors);
      }
    }
  }

  public tick(time: number): void {
    this.sceneObject.castShadow = this.castShadow;
    this.sceneObject.receiveShadow = this.receiveShadow;
    this.sceneObject.visible = this.visible;
    this.sceneObject.position.fromArray(this.position);
    this.sceneObject.rotation.fromArray(this.rotation);
    this.sceneObject.scale.fromArray(this.scale);
    this.sceneObject.up.fromArray(this.up);
  }
}
