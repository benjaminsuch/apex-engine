import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { EProxyThread } from './core/class/specifiers/proxy';
import { type IEngineLoopTickContext } from './EngineLoop';
import { ETickGroup, TickFunction } from './TickManager';

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

  protected proxyQueue: RegisteredProxy<T>[][] = [];

  public enqueueProxy(thread: EProxyThread, proxy: T, args: unknown[]): boolean {
    const idx = this.proxyQueue[thread].findIndex(({ target }) => target === proxy);

    if (idx === -1) {
      const registeredProxy = new RegisteredProxy(thread, proxy, args);
      this.proxyQueue[thread].push(registeredProxy);
      return this.registerProxy(registeredProxy);
    }

    return false;
  }

  protected readonly proxies: ProxyRegistry<RegisteredProxy<T>>;

  public registerProxy(proxy: RegisteredProxy<T>): boolean {
    return this.proxies.register(proxy);
  }

  public getProxy(id: number): T | void {
    for (const proxy of this.proxies) {
      if ((proxy.target as any).id === id) {
        return proxy.target;
      }
    }
  }

  protected managerTick: TickFunction<any>;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (ProxyManager.instance) {
      throw new Error(`An instance of the ProxyManager already exists.`);
    }

    for (let i = 0; i < EProxyThread.MAX; ++i) {
      this.proxyQueue[i] = [];
    }

    this.proxies = this.instantiationService.createInstance(ProxyRegistry);
    this.managerTick = this.instantiationService.createInstance(ProxyManagerTickFunction, this);

    this.registerTickFunctions();

    ProxyManager.instance = this;
  }

  public init(): void {}

  public tick(tick: IEngineLoopTickContext): void {
    if (this.proxyQueue.length > 0) {
      if (this.onProcessProxyQueue(tick)) {
        this.proxyQueue = [];
      }
    }
  }

  /**
   * This method will be called each tick and only if `proxyQueue` is not empty.
   * Use it to modify how `proxyQueue` will be processed.
   *
   * @param tick
   * @returns Returning `true` will reset `proxyQueue` to an empty array.
   */
  protected onProcessProxyQueue(tick: IEngineLoopTickContext): boolean {
    return false;
  }

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
      this.logger.warn(`Proxy is already registered. Aborting.`);
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

export class RegisteredProxy<T> {
  constructor(public readonly thread: EProxyThread, public readonly target: T, public readonly args: unknown[]) {}
}
