import { PerspectiveCamera } from 'three';

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
  declare aspect: number;

  declare far: number;

  declare filmGauge: number;

  declare filmOffset: number;

  declare focus: number;

  declare fov: number;

  declare near: number;

  declare zoom: number;

  public override sceneObject: PerspectiveCamera;

  constructor(
    [fov, aspect, near, far]: [number, number, number, number],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly renderer: IInternalRenderWorkerContext
  ) {
    super([aspect, far, fov, near], tb, id, renderer);

    const camera = this.renderer.camera as PerspectiveCamera;
    this.sceneObject = new PerspectiveCamera(fov, camera.aspect, near, far);
    this.renderer.camera = this.sceneObject;
  }

  public override tick(tick: IEngineLoopTickContext): void {
    super.tick(tick);

    this.sceneObject.aspect = this.aspect;
    this.sceneObject.far = this.far;
    this.sceneObject.filmGauge = this.filmGauge;
    this.sceneObject.filmOffset = this.filmOffset;
    this.sceneObject.focus = this.focus;
    this.sceneObject.fov = this.fov;
    this.sceneObject.near = this.near;
    this.sceneObject.zoom = this.zoom;
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

  public updateRotation(x: number, y: number): void {
    this.rotation.x += -y * 0.0025;
    this.rotation.y += -x * 0.0025;
  }
}
