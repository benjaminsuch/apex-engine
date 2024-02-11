import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { getClassSchema, getTargetId, isPropSchema } from './core/class/decorators';
import { EProxyThread, type IProxyConstructionData, type IProxyOrigin } from './core/class/specifiers/proxy';
import { TripleBuffer } from './core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from './EngineLoop';
import { ProxyInstance } from './ProxyInstance';
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

  protected proxyQueue: EnqueuedProxy<T>[][] = [];

  protected readonly deferredProxies: Map<number, DeferredProxy> = new Map();

  protected managerTick: TickFunction<any>;

  public readonly proxies: ProxyRegistry<RegisteredProxy<T>>;

  constructor(
    public readonly thread: EProxyThread,
    private readonly proxyConstructors: Record<string, TClass> = {},
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

  public createInstance(data: IProxyConstructionData, onCreate?: (proxy: T | void) => MaybePromise<void>): void {
    const { constructor, id, tb, args, originThread, ref } = data;
    const ProxyConstructor = this.getProxyConstructor(constructor);
    const originClass = Reflect.getMetadata('proxy:origin', ProxyConstructor);

    if (!ProxyConstructor) {
      this.logger.warn(`Constructor (${constructor}) not found for proxy "${id}".`);
      return;
    }

    const getProxyDependencies = (ProxyConstructor: TClass): any[] => {
      const schema = getClassSchema(ProxyConstructor);

      if (!schema) {
        this.logger.warn(`No schema found for "${ProxyConstructor.name}".`);
        return [];
      }

      return Object.entries(schema).reduce<any[]>((res, [prop, def]) => {
        if (isPropSchema(def)) {
          if (def.type === 'ref' && def.required === true) {
            res.push({ prop, ...def });
          }
        }

        return res;
      }, []);
    };

    const dependencies = getProxyDependencies(originClass);
    const onCreateHandler = (): MaybePromise<void> => {
      const proxy = this.onCreateInstance(
        ProxyConstructor,
        args,
        new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
        id,
        originThread
      );
      onCreate?.(proxy);
      if (ref) {
        console.log('proxy dependency:', proxy);
      }
    };

    if (dependencies.length) {
      this.deferredProxies.set(id, new DeferredProxy(data, dependencies, onCreateHandler));
      return;
    }

    onCreateHandler();

    if (ref) {
      for (const [parentId, prop] of ref.parents) {
        const parent = this.deferredProxies.get(parentId);

        if (parent) {
          parent.dependencies.set(prop, true);

          let canResolve = true;

          for (const resolved of parent.dependencies.values()) {
            if (!canResolve) {
              break;
            }
            canResolve = resolved;
          }

          if (canResolve) {
            console.log('resolve', parent);
            parent.resolve();
          }
        } else {
          this.logger.warn(`Proxy with id "${parentId}" does not exist.`);
        }
      }
    }
  }

  protected onCreateInstance(Constructor: TClass, args: any[], tb: TripleBuffer, id: number, originThread: number): T {
    return this.instantiationService.createInstance(Constructor, args, tb, id, originThread);
  }

  public enqueueProxy(thread: EProxyThread, proxy: T, args: unknown[]): boolean {
    const idx = this.proxyQueue[thread].findIndex(({ target }) => target === proxy);

    if (idx === -1) {
      const enqueuedProxy = new EnqueuedProxy(thread, proxy, args);
      enqueuedProxy.index = this.proxyQueue[thread].push(enqueuedProxy) - 1;
      this.registerProxy(proxy, thread);
      return true;
    }

    return false;
  }

  public getEnqueuedProxy(id: number, thread: EProxyThread = this.thread): EnqueuedProxy<any> | void {
    for (const proxy of this.proxyQueue[thread]) {
      if (proxy.thread === thread) {
        const proxyId = proxy.target instanceof ProxyInstance ? proxy.target.id : getTargetId(proxy.target);

        if (proxyId === id) {
          return proxy;
        }
      }
    }

    this.logger.warn(`Unable to find enqueued proxy with id "${id}".`);
  }

  public registerProxy(proxy: T, thread: EProxyThread = this.thread): void {
    const registeredProxy = new RegisteredProxy(thread, proxy);
    registeredProxy.index = this.proxies.register(registeredProxy);
  }

  public getRegisteredProxy(id: number, thread: EProxyThread = this.thread): RegisteredProxy<any> | void {
    for (const proxy of this.proxies) {
      if (proxy.thread === thread) {
        const proxyId = proxy.target instanceof ProxyInstance ? proxy.target.id : getTargetId(proxy.target);

        if (proxyId === id) {
          return proxy;
        }
      }
    }

    this.logger.warn(`Unable to find registered proxy with id "${id}".`);
  }

  public getProxy<R extends InstanceType<TClass> = IProxyOrigin>(id: number, thread: EProxyThread = this.thread): R | void {
    for (const proxy of this.proxies) {
      if (proxy.thread === thread) {
        const proxyId = proxy.target instanceof ProxyInstance ? proxy.target.id : getTargetId(proxy.target);

        if (proxyId === id) {
          // Later in development it turned out, that we would have both, proxy instances and origins in our proxy registry.
          // @todo: Improve/simplify
          return proxy.target as unknown as R;
        }
      }
    }
  }

  public tick(tick: IEngineLoopTickContext): void {
    let queueSize = 0;

    for (let i = 0; i < EProxyThread.MAX; ++i) {
      queueSize += this.proxyQueue[i].length;
    }

    if (queueSize > 0) {
      if (this.onProcessProxyQueue(tick)) {
        this.resetProxyQueue();
      }
    }

    for (let i = 0; i < this.proxies.entries; ++i) {
      const proxy = this.proxies.getProxyByIndex(i);

      if (proxy) {
        const target = proxy.target as IProxyOrigin;

        if (!(target instanceof ProxyInstance)) {
          target.tripleBuffer.copyToWriteBuffer(target.byteView);
        }
      }
    }
  }

  public getProxyConstructor(id: string): TClass {
    return this.proxyConstructors[id];
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

  protected resetProxyQueue(): void {
    for (let i = 0; i < EProxyThread.MAX; ++i) {
      this.proxyQueue[i] = [];
    }
  }
}

class ProxyRegistry<T> {
  private readonly list: T[] = [];

  public getProxyByIndex(idx: number): T | undefined {
    return this.list[idx];
  }

  /**
   * @param registeredProxy
   * @returns Index of where the proxy is in our list of registered proxies.
   */
  public register(registeredProxy: T): number {
    this.entries = this.list.push(registeredProxy);
    return this.entries - 1;
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
  public index: number = -1;

  constructor(public readonly thread: EProxyThread, public readonly target: T) {}
}

export class EnqueuedProxy<T> extends RegisteredProxy<T> {
  public readonly parents: Map<IProxyOrigin, string> = new Map();

  constructor(thread: EProxyThread, target: T, public readonly args: unknown[]) {
    super(thread, target);
  }
}

export class DeferredProxy {
  public readonly dependencies: Map<string, boolean> = new Map();

  constructor(public readonly data: IProxyConstructionData, dependencies: any[], public readonly resolve: () => MaybePromise<void>) {
    for (const { prop } of dependencies) {
      this.dependencies.set(prop, false);
    }
  }
}
