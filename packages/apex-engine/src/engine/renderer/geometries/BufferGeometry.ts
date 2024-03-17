import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, serialize, string } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';

export class BufferGeometryProxy extends RenderProxy<THREE.BufferGeometry> {
  declare morphTargetsRelative: boolean;

  declare name: BufferGeometry['name'];

  protected readonly object: THREE.BufferGeometry;

  constructor([data]: [BufferGeometryProxyArgs], tb: TripleBuffer, id: number, originThread: EProxyThread, renderer: RenderWorker) {
    super([], tb, id, originThread, renderer);

    const { attributes, index, boundingSphere, uuid, name } = data;
    const { position, normal, uv } = attributes;

    this.object = new THREE.BufferGeometry();

    this.object.setAttribute('position', createBufferAttribute(position));
    if (normal) this.object.setAttribute('normal', createBufferAttribute(normal));
    if (uv) this.object.setAttribute('uv', createBufferAttribute(uv));

    this.object.setIndex(createBufferAttribute(index as THREE.IBufferAttributeJSON));

    this.object.name = name;
    this.object.uuid = uuid;
    this.object.boundingSphere = new THREE.Sphere(new THREE.Vector3().fromArray(boundingSphere.center), boundingSphere.radius);
  }

  public override tick(context: IEngineLoopTickContext): void | Promise<void> {
    this.object.morphTargetsRelative = this.morphTargetsRelative;
  }
}

export interface BufferGeometryProxyArgs {
  attributes: {
    position: THREE.IBufferAttributeJSON;
    normal?: THREE.IBufferAttributeJSON;
    uv?: THREE.IBufferAttributeJSON;
  };
  boundingSphere: {
    center: [number, number, number];
    radius: number;
  };
  index: {
    array: number[];
    type: string;
  };
  name: string;
  uuid: string;
}

@CLASS(proxy(EProxyThread.Render, BufferGeometryProxy))
export class BufferGeometry<Attributes extends THREE.NormalOrGLBufferAttributes = THREE.NormalBufferAttributes> extends THREE.BufferGeometry<Attributes> implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  declare name: string;

  @PROP(serialize(boolean))
  declare morphTargetsRelative: boolean;

  public tick(): void {}

  public getProxyArgs(): [BufferGeometryProxyArgs] {
    return [
      {
        ...(this.toJSON() as any).data,
        name: this.name,
        uuid: this.uuid,
      },
    ];
  }
}

function createBufferAttribute({ type, array, itemSize = 1, normalized = false }: THREE.IBufferAttributeJSON): THREE.BufferAttribute {
  const ArrayConstructor = Array.TYPED_ARRAY_CONSTRUCTORS[type];

  if (Array.isBigInt64Array(ArrayConstructor) || Array.isBigUint64Array(ArrayConstructor)) {
    throw new Error(`Cannot use BigInt arrays.`);
  }

  return new THREE.BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
}
