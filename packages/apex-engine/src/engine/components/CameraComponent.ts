import { type Camera, PerspectiveCamera } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS, PROP } from '../core/class/decorators';
import { proxy } from '../core/class/specifiers/proxy';
import { serialize, uint8, uint16 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { type IInternalRenderWorkerContext } from '../renderer/Render.worker';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class CameraComponentProxy extends SceneComponentProxy {
  public override sceneObject: Camera;

  constructor(
    [aspect, far, fov, near]: [number, number, number, number],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly renderer: IInternalRenderWorkerContext
  ) {
    super([aspect, far, fov, near], tb, id, renderer);

    this.sceneObject = new PerspectiveCamera(fov, aspect, near, far);
    renderer.camera = this.sceneObject;
  }
}

@CLASS(proxy(CameraComponentProxy))
export class CameraComponent extends SceneComponent {
  @PROP(serialize(uint8))
  public aspect: number = 1;

  @PROP(serialize(uint16))
  public far: number = 2000;

  @PROP(serialize(uint16))
  public filmGauge: number = 35;

  @PROP(serialize(uint16))
  public filmOffset: number = 0;

  @PROP(serialize(uint16))
  public focus: number = 10;

  @PROP(serialize(uint16))
  public fov: number = 50;

  @PROP(serialize(uint16))
  public near: number = 0.1;

  @PROP(serialize(uint16))
  public zoom: number = 1;

  constructor(
    fov: CameraComponent['fov'],
    aspect: CameraComponent['aspect'],
    near: CameraComponent['near'],
    far: CameraComponent['far'],
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    this.componentTick.canTick = true;
  }

  public override tick(context: IEngineLoopTickContext): void {
    // console.log('quat', ...this.quaternion.toArray());
  }
}
