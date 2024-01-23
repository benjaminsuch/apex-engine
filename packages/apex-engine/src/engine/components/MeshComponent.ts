import { BufferAttribute, BufferGeometry, type IBufferAttributeJSON, type IGeometryData, type IMaterialJSON, type Material, Mesh, MeshStandardMaterial, Sphere, Vector2, Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS } from '../core/class/decorators';
import { proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IInternalRenderWorkerContext } from '../renderer/Render.worker';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy {
  constructor(
    [geometryData, materialData]: [IGeometryData | undefined, IMaterialJSON | undefined] = [undefined, undefined],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly renderer: IInternalRenderWorkerContext
  ) {
    super([geometryData, materialData], tb, id, renderer);

    const args: [BufferGeometry | undefined, Material | undefined] = [undefined, undefined];

    if (geometryData) {
      const { attributes, boundingSphere, index } = geometryData;
      const { normal, position, uv } = attributes;
      const geometry = new BufferGeometry();

      geometry.setAttribute('position', createBufferAttribute({ ...position, type: position.array.constructor.name }));
      geometry.setAttribute('normal', createBufferAttribute({ ...normal, type: normal.array.constructor.name }));
      geometry.setAttribute('uv', createBufferAttribute({ ...uv, type: uv.array.constructor.name }));
      geometry.setIndex(createBufferAttribute({ ...index, normalized: false, itemSize: 1, type: 'Uint16Array' }));

      if (boundingSphere) {
        geometry.boundingSphere = new Sphere(new Vector3().fromArray(boundingSphere.center), boundingSphere.radius);
      }

      args[0] = geometry;
    }

    if (materialData) {
      const { aoMap, map, metalnessMap, normalMap, normalScale, roughnessMap, type, ...params } = materialData;

      if (type === 'MeshStandardMaterial') {
        const material = new MeshStandardMaterial({
          ...params,
          normalScale: new Vector2(normalScale.x, normalScale.y),
        });

        args[1] = material;
      }
    }

    this.sceneObject = new Mesh(...args);
  }
}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  constructor(
    public geometry: BufferGeometry | undefined = undefined,
    public material: Material | undefined = undefined,
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);
  }
}

const TYPED_ARRAYS = {
  Uint16Array,
  Int16Array,
  Uint8Array,
  Int8Array,
  Int32Array,
  Uint32Array,
  Float32Array,
} as const;

function createBufferAttribute({ type, array, itemSize, normalized }: IBufferAttributeJSON): BufferAttribute {
  const ArrayConstructor = TYPED_ARRAYS[type as keyof typeof TYPED_ARRAYS];

  if (ArrayConstructor) {
    return new BufferAttribute(new ArrayConstructor(array), itemSize, normalized);
  }

  throw new Error(`Unknown array type.`);
}
