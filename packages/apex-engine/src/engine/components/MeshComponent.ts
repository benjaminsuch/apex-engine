import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { type TripleBuffer } from '../../platform/memory/common';
import { IRenderer } from '../../platform/renderer/common';
import { SceneProxy } from '../SceneProxy';
import { CLASS, PROP } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { float32, int16, serialize } from '../class/specifiers/serialize';
import { SceneComponent } from './SceneComponent';

export class MeshComponentProxy extends SceneProxy {
  declare geometry: THREE.BufferGeometry;

  declare material: THREE.Material;

  public mesh: THREE.Mesh = new THREE.Mesh();

  constructor(id: number, tb: TripleBuffer) {
    super(id, tb);
  }

  public override tick(time: number): void {
    super.tick(time);

    this.mesh.position.fromArray(this.position);
    this.mesh.rotation.fromArray(this.rotation);
    this.mesh.scale.fromArray(this.scale);
    this.mesh.up.fromArray(this.up);
  }
}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  @PROP(serialize(int16))
  public test: number = 8;

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderer protected readonly renderer: IRenderer
  ) {
    super(instantiationService, logger);
  }
}
