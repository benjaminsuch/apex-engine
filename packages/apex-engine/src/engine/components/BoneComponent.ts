import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { type TripleBuffer } from '../../platform/memory/common';
import { IRenderingPlatform } from '../../platform/rendering/common';
import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { type Renderer } from '../renderer';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class BoneComponentProxy extends SceneComponentProxy {
  public override sceneObject: THREE.Bone;

  constructor(
    args: any[],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly messagePort: MessagePort | null = null,
    protected override readonly renderer: Renderer
  ) {
    super(args, tb, id, messagePort, renderer);
    console.log('bone args', args);
    const [{ uuid }] = args;
    this.sceneObject = new THREE.Bone();
    this.sceneObject.uuid = uuid;
    console.log('bone sceneObject uuid', this.sceneObject.uuid);
  }
}

@CLASS(proxy(BoneComponentProxy))
export class BoneComponent extends SceneComponent {
  constructor(
    defaults: any,
    geometries: any[],
    materials: any[],
    images: any[],
    textures: any[],
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderingPlatform protected readonly renderer: IRenderingPlatform
  ) {
    super(instantiationService, logger);
  }
}
