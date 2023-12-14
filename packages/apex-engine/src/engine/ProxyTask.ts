import { type IEngineLoopTickContext } from './EngineLoop';
import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { type ProxyManager } from './ProxyManager';

export abstract class ProxyTask<Data> {
  constructor(
    public readonly data: Data,
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public abstract run(proxyManager: ProxyManager<any>, context: IEngineLoopTickContext): boolean;

  public end(proxyManager: ProxyManager<any>): boolean {
    return true;
  }
}
