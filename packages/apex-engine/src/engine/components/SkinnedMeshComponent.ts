import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { type TripleBuffer } from '../../platform/memory/common';
import { IRenderingPlatform } from '../../platform/rendering/common';
import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { type Renderer } from '../renderer';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class SkinnedMeshComponentProxy extends SceneComponentProxy {
  public override sceneObject: THREE.SkinnedMesh;

  constructor(
    args: any[],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly messagePort: MessagePort | null = null,
    protected override readonly renderer: Renderer
  ) {
    super(args, tb, id, messagePort, renderer);
    console.log('skinnedmeshproxy args', args);
    const [,{ attributes, index },, { bones, boneInverses }] = args;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new self[attributes.position.type as keyof typeof self](attributes.position.array), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new self[attributes.normal.type as keyof typeof self](attributes.normal.array), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new self[attributes.uv.type as keyof typeof self](attributes.uv.array), 2));
    geometry.setAttribute('skinIndex', new THREE.BufferAttribute(new self[attributes.skinIndex.type as keyof typeof self](attributes.skinIndex.array), 4));
    geometry.setAttribute('skinWeight', new THREE.BufferAttribute(new self[attributes.skinWeight.type as keyof typeof self](attributes.skinWeight.array), 4));
    geometry.setIndex(index.array);
    console.log('bones', bones);
    console.log('render bone', this.renderer.scene.children.slice());
    bones.forEach((id) => {
      console.log('bone found in scene:', id, this.renderer.scene.getObjectById(id));
    });
    // const skeleton = new THREE.Skeleton(bones, boneInverses);
    this.sceneObject = new THREE.SkinnedMesh(geometry);
    // this.sceneObject.bind(skeleton, new THREE.Matrix4());
  }
}

@CLASS(proxy(SkinnedMeshComponentProxy))
export class SkinnedMeshComponent extends SceneComponent {
  constructor(
    defaults: any,
    geometry: any,
    material: any,
    skeleton: any,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderingPlatform protected readonly renderer: IRenderingPlatform
  ) {
    super(instantiationService, logger);
  }
}
