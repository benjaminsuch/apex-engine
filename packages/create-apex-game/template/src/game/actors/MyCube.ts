import { Actor, BoxComponent, IEngineLoopTickContext } from 'apex-engine/src/engine';
import { IInstatiationService } from 'apex-engine/src/platform/di/common';
import { IConsoleLogger } from 'apex-engine/src/platform/logging/common';
import { IRenderingPlatform } from 'apex-engine/src/platform/rendering/common';

export class MyCube extends Actor {
  private readonly box: BoxComponent;

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderingPlatform public override readonly renderer: IRenderingPlatform
  ) {
    super(instantiationService, logger, renderer);

    this.actorTick.canTick = true;

    this.box = this.addComponent(BoxComponent, 2, 2, 2);
    this.box.setAsRoot(this);
  }

  public override tick(context: IEngineLoopTickContext): void {
    this.box.position.y = 1 + Math.sin(context.delta * 0.0025);
  }
}
