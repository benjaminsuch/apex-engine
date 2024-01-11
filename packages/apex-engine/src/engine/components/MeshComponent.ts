import { BufferAttribute, BufferGeometry, type IBufferAttributeJSON, type IGeometryJSON, type IMaterialJSON, type Material, Mesh, MeshPhongMaterial, MeshStandardMaterial, Sphere, Vector2, Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS } from '../core/class/decorators';
import { proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IInternalRenderWorkerContext } from '../renderer/Render.worker';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy {
  constructor(
    [geometryData, materialData]: [IGeometryJSON | undefined, IMaterialJSON | undefined] = [undefined, undefined],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly renderer: IInternalRenderWorkerContext
  ) {
    super([geometryData, materialData], tb, id, renderer);

    const args: [BufferGeometry | undefined, Material | undefined] = [undefined, undefined];

    if (geometryData) {
      const { attributes, boundingSphere, index } = geometryData.data;

      if (geometryData.type === 'BufferGeometry') {
        const geometry = new BufferGeometry();

        geometry.setAttribute('position', createBufferAttribute(attributes.position));
        geometry.setAttribute('normal', createBufferAttribute(attributes.normal));
        geometry.setAttribute('uv', createBufferAttribute(attributes.uv));
        geometry.setIndex(index.array);
        geometry.boundingSphere = new Sphere(new Vector3().fromArray(boundingSphere.center), boundingSphere.radius);

        args[0] = geometry;
      }
    }

    if (materialData) {
      const { aoMap, map, metalnessMap, normalMap, normalScale, roughnessMap, type, ...params } = materialData;

      if (type === 'MeshStandardMaterial') {
        const material = new MeshStandardMaterial({
          ...params,
          normalScale: new Vector2(...normalScale),
        });
        args[1] = material;
      }
    }

    if (IS_DEV) {
      args[1] = new MeshPhongMaterial({ color: [0xe7cf7c, 0xe75e4f][Math.round(Math.random())], depthWrite: false });
    }

    this.sceneObject = new Mesh(...args);
  }
}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  constructor(
    public geometry: IGeometryJSON | undefined = undefined,
    public material: IMaterialJSON | undefined = undefined,
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);
  }
}

function createBufferAttribute({ type, array, itemSize, normalized }: IBufferAttributeJSON): BufferAttribute {
  let ArrayConstructor: undefined | TypedArray;

  if (type === 'Uint16Array') {
    ArrayConstructor = Uint16Array;
  } else if (type === 'Int16Array') {
    ArrayConstructor = Int16Array;
  } else if (type === 'Uint8Array') {
    ArrayConstructor = Uint8Array;
  } else if (type === 'Int8Array') {
    ArrayConstructor = Int8Array;
  } else if (type === 'Int32Array') {
    ArrayConstructor = Int32Array;
  } else if (type === 'Uint32Array') {
    ArrayConstructor = Uint32Array;
  } else if (type === 'Float32Array') {
    ArrayConstructor = Float32Array;
  }

  if (ArrayConstructor) {
    return new BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
  }

  throw new Error(`Unknown array type.`);
}
