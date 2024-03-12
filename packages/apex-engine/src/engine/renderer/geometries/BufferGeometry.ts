import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, serialize, string } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';

export class BufferGeometryProxy extends RenderProxy<THREE.BufferGeometry> {
  declare name: BufferGeometry['name'];

  protected readonly object: THREE.BufferGeometry;

  constructor(
    [data]: [any],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([], tb, id, thread, renderer);

    const { attributes, index, boundingSphere } = data;
    const { position, normal, uv } = attributes;

    this.object = new THREE.BufferGeometry();
    this.object.setAttribute('position', createBufferAttribute(position));
    this.object.setAttribute('normal', createBufferAttribute(normal));
    this.object.setAttribute('uv', createBufferAttribute(uv));
    this.object.setIndex(createBufferAttribute(index));
    this.object.boundingSphere = new THREE.Sphere(boundingSphere.center, boundingSphere.radius);
  }
}

@CLASS(proxy(EProxyThread.Render, BufferGeometryProxy))
export class BufferGeometry<Attributes extends THREE.NormalOrGLBufferAttributes = THREE.NormalBufferAttributes> extends THREE.BufferGeometry<Attributes> implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  @PROP(serialize(string))
  declare name: string;

  @PROP(serialize(boolean))
  declare morphTargetsRelative: boolean;

  public tick(): void {}

  public getProxyArgs(): [any] {
    return [(this.toJSON() as any).data];
  }
}

function createBufferAttribute({ type, array, itemSize, normalized }: THREE.IBufferAttributeJSON): THREE.BufferAttribute {
  const ArrayConstructor = Array.TYPED_ARRAY_CONSTRUCTORS[type];

  if (Array.isBigInt64Array(ArrayConstructor) || Array.isBigUint64Array(ArrayConstructor)) {
    throw new Error(`Cannot use BigInt arrays.`);
  }

  return new THREE.BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
}
