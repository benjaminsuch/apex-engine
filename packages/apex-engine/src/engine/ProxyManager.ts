import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type IEngineLoopTickContext } from './EngineLoop';
import { ETickGroup, TickFunction } from './TickManager';

export interface IEnqueuedProxy<T> {
  target: T;
  args: unknown[];
}

export class ProxyManager<T> {
  private static instance?: ProxyManager<any>;

  // I don't like applying the singleton pattern for this class, but an architectural
  // issue with the proxies force me to do so.
  //
  // For context: Currently, I don't see a way to pass the instance of ProxyManager to
  // the class that is returned by our `proxy` specifier (see /class/specifiers/proxy.ts).
  public static getInstance(): ProxyManager<any> {
    if (!this.instance) {
      throw new Error(`There is no instance of ProxyManager.`);
    }
    return this.instance;
  }

  protected proxyQueue: IEnqueuedProxy<T>[] = [];

  public enqueueProxy(proxy: T, args: unknown[]): boolean {
    const idx = this.proxyQueue.findIndex(({ target }) => target === proxy);

    if (idx === -1) {
      this.proxyQueue.push({ target: proxy, args });
      return this.registerProxy(proxy);
    }

    return false;
  }

  protected readonly proxies: ProxyRegistry<T>;

  public registerProxy(proxy: T): boolean {
    return this.proxies.register(proxy);
  }

  protected managerTick: TickFunction<any>;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (ProxyManager.instance) {
      throw new Error(`An instance of the ProxyManager already exists.`);
    }

    this.proxies = this.instantiationService.createInstance(ProxyRegistry);
    this.managerTick = this.instantiationService.createInstance(ProxyManagerTickFunction, this);

    this.registerTickFunctions();

    ProxyManager.instance = this;
  }

  public init(): void {}

  public tick(tick: IEngineLoopTickContext): void {}

  protected registerTickFunctions(): void {
    if (!this.managerTick.isRegistered) {
      this.managerTick.canTick = true;
      this.managerTick.tickGroup = ETickGroup.PostPhysics;
      this.managerTick.register();
    }
  }
}

class ProxyRegistry<T> {
  private readonly list: T[] = [];

  public getProxyByIndex(idx: number): T | undefined {
    return this.list[idx];
  }

  public register(proxy: T): boolean {
    const idx = this.list.indexOf(proxy);

    if (idx > -1) {
      this.logger.warn(`Proxy is already registered. Aborting.1`);
      return false;
    }

    this.entries = this.list.push(proxy);

    return true;
  }

  public entries: number = 0;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {}

  public *[Symbol.iterator](): Generator<T, any, any> {
    let idx = 0;

    while (idx < this.list.length) {
      yield this.list[idx++];
    }
  }
}

class ProxyManagerTickFunction extends TickFunction<ProxyManager<any>> {
  public override run(tick: IEngineLoopTickContext): void {
    this.target.tick(tick);
  }
}
