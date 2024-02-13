import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { getClassSchema, getTargetId, isPropSchema, type PropSchema } from './core/class/decorators';
import { EProxyThread, type IProxyConstructionData, type IProxyOrigin, type TProxyOriginConstructor } from './core/class/specifiers/proxy';
import { TripleBuffer, type TripleBufferJSON } from './core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type ProxyInstance } from './ProxyInstance';
import { ETickGroup, TickFunction } from './TickManager';

export class ProxyManager {
  private static instance?: ProxyManager;

  // I don't like applying the singleton pattern for this class, but an architectural
  // issue with the proxies force me to do so.
  //
  // For context: Currently, I don't see a way to pass the instance of ProxyManager to
  // the class that is returned by our `proxy` specifier (see /class/specifiers/proxy.ts).
  public static getInstance(): ProxyManager {
    if (!this.instance) {
      throw new Error(`There is no instance of ProxyManager.`);
    }
    return this.instance;
  }

  protected readonly deploymentQueue: ProxyDeployment[] = [];

  protected deferredDeploymentMessages: IProxyConstructionData[] = [];

  public readonly origins: IProxyOrigin[] = [];

  public readonly proxies: RegisteredProxy<any>[] = [];

  protected managerTick: TickFunction<any>;

  constructor(
    /**
     * The thread the proxy manager is working on. This is especially relevant for the
     * "proxy" specifier (see /core/class/specifiers/proxy.ts) when it creates the triple buffer.
     */
    public readonly thread: EProxyThread,
    private readonly proxyConstructors: Record<string, TClass> = {},
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (ProxyManager.instance) {
      throw new Error(`An instance of the ProxyManager already exists.`);
    }

    this.managerTick = this.instantiationService.createInstance(ProxyManagerTickFunction, this);

    this.registerTickFunctions();

    ProxyManager.instance = this;
  }

  public tick(tick: IEngineLoopTickContext): void {
    if (this.deploymentQueue.length) {
      const queue: IProxyConstructionData[][] = [];

      for (let i = 0; i < EProxyThread.MAX; ++i) {
        queue.push([]);
      }

      let deployment: ProxyDeployment | undefined;

      while (deployment = this.deploymentQueue.shift()) {
        if (deployment) {
          deployment.tick = tick.id;
          queue[deployment.thread].push(deployment.toJSON());
        }
      }

      this.onSubmitDeployments(queue);
    }

    if (this.deferredDeploymentMessages.length) {
      const stack = this.deferredDeploymentMessages;

      this.deferredDeploymentMessages = [];
      this.registerProxies(stack);
    }

    for (let i = 0; i < this.origins.length; ++i) {
      const origin = this.origins[i];
      origin.tripleBuffer.copyToWriteBuffer(origin.byteView);
    }

    for (let i = 0; i < this.proxies.length; ++i) {
      this.proxies[i].target.tick(tick);
    }
  }

  /**
   * Creates a `ProxyDeployment` and pushes it in a queue, that is submitted every
   * tick (if the queue has items).
   *
   * @param origin
   * @param args
   * @param thread The thread where the proxy is being instantiated on.
   */
  public deployProxy(origin: IProxyOrigin, args: unknown[], thread: EProxyThread): void {
    this.origins.push(origin);
    this.deploymentQueue.push(new ProxyDeployment(origin, args, thread));
  }

  public async registerProxies(stack: IProxyConstructionData[]): Promise<void> {
    let data: IProxyConstructionData | undefined;

    while (data = stack.shift()) {
      if (data) {
        const { constructor, id, tb, args, originThread, parents, tick } = data;
        const ProxyConstructor = this.getProxyConstructor(constructor);

        if (!ProxyConstructor) {
          this.logger.warn(`Proxy registration aborted for "${id}": No proxy class found for "${constructor}".`);
          continue;
        }

        const dependencies = this.getProxyDependencies(ProxyConstructor, id, tb);

        if (dependencies.length) {
          let hasUnresolvedDependencies = false;

          for (const dependency of dependencies) {
            if (hasUnresolvedDependencies) {
              break;
            }
            hasUnresolvedDependencies = !!dependency.id;
          }

          if (hasUnresolvedDependencies) {
            console.info(`Proxy "${id}" has unresolved dependencies and will be deferred.`);
            this.deferredDeploymentMessages.push(data);
            continue;
          }
        }

        const target = await this.onRegisterProxy(
          ProxyConstructor,
          args,
          new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
          id,
          originThread
        );

        this.proxies.push(new RegisteredProxy(target, originThread, tick));
      }
    }
  }

  public getOrigin<T>(id: number, throwIfNotFound: boolean = false): T | undefined {
    let result: T | undefined;

    for (let i = 0; i < this.origins.length; ++i) {
      const origin = this.origins[i];

      if (getTargetId(origin) === id) {
        result = origin as T;
      }
    }

    if (!throwIfNotFound && result) {
      throw new Error(`Couldn't find proxy origin "${id}".`);
    }

    return result;
  }

  public getProxy<T>(id: ProxyInstance['id'], originThread: EProxyThread): RegisteredProxy<T> | void {
    for (let i = 0; i < this.proxies.length; ++i) {
      const proxy = this.proxies[i];

      if (proxy.originThread === originThread && proxy.target.id === id) {
        return proxy;
      }
    }
  }

  /**
   * Adds a parent to a `ProxyDeployment`.
   *
   * @param id
   * @param parent
   * @param prop
   */
  public addParent(id: number, parent: IProxyOrigin, prop: string): void {
    for (const deployment of this.deploymentQueue) {
      if (getTargetId(deployment.origin) === id) {
        deployment.parents.set(parent, prop);
      } else {
        this.logger.warn(`Adding a parent failed: Unable to find proxy deployment for "${id}".`);
      }
    }
  }

  protected onRegisterProxy(Constructor: TClass, args: any[], tb: TripleBuffer, id: number, originThread: number): MaybePromise<ProxyInstance> {
    return this.instantiationService.createInstance(Constructor, args, tb, id, originThread);
  }

  protected onSubmitDeployments(queue: IProxyConstructionData[][]): MaybePromise<void> {}

  protected getProxyConstructor(id: string): TClass {
    return this.proxyConstructors[id];
  }

  protected getProxyDependencies(ProxyConstructor: TClass, id: ProxyInstance['id'], tb: TripleBufferJSON): ProxyDependency[] {
    const originClass = Reflect.getMetadata('proxy:origin', ProxyConstructor);
    const schema = getClassSchema(originClass);
    const dependencies: ProxyDependency[] = [];

    if (!schema) {
      this.logger.warn(`No schema found for "${originClass.name}".`);
      return [];
    }

    for (const prop in schema) {
      const propSchema = schema[prop];

      if (isPropSchema(propSchema)) {
        const { type, required } = propSchema;

        if (type === 'ref' && required === true) {
          const dependency = new ProxyDependency({ prop, ...propSchema }, id, tb);
          dependencies.push(dependency);
        }
      }
    }

    return dependencies;
  }

  protected registerTickFunctions(): void {
    if (!this.managerTick.isRegistered) {
      this.managerTick.canTick = true;
      this.managerTick.tickGroup = ETickGroup.PostPhysics;
      this.managerTick.register();
    }
  }
}

class ProxyManagerTickFunction extends TickFunction<ProxyManager> {
  public override run(tick: IEngineLoopTickContext): void {
    this.target.tick(tick);
  }
}

export class ProxyDeployment {
  public tick: IEngineLoopTickContext['id'] = -1;

  public readonly parents: Map<IProxyOrigin, string> = new Map();

  constructor(public readonly origin: IProxyOrigin, public readonly args: any[], public readonly thread: EProxyThread) {}

  public toJSON(): IProxyConstructionData {
    return {
      constructor: (this.origin.constructor as TProxyOriginConstructor).proxyClassName,
      id: getTargetId(this.origin) as number,
      tb: this.origin.tripleBuffer,
      args: this.args,
      originThread: EProxyThread.Game,
      parents: [],
      tick: this.tick,
    };
  }
}

export class ProxyDependency {
  private readonly views: [DataView, DataView, DataView];

  public isResolved: boolean = false;

  public prop: string;

  /**
   * Returns the id of the dependency or undefined if it hasn't been assigned yet.
   */
  public get id(): number | undefined {
    const idx = TripleBuffer.getReadBufferIndexFromFlags(this.tb.flags);
    return this.views[idx].getUint32(this.schema.offset, true);
  }

  constructor(private readonly schema: { prop: string } & PropSchema, public readonly parentId: number, private readonly tb: TripleBufferJSON) {
    this.prop = schema.prop;
    this.views = [new DataView(tb.buffers[0]), new DataView(tb.buffers[1]), new DataView(tb.buffers[2])];
  }
}

export class ProxyQueue {
  public size: number = 0;

  public readonly queue: ProxyDeployment[] = [];

  public add(deployment: ProxyDeployment): number {
    return this.queue.push(deployment) - 1;
  }

  public *[Symbol.iterator](): Generator<ProxyDeployment, any, any> {
    let idx = 0;

    while (idx < this.queue.length) {
      yield this.queue[idx++];
    }
  }
}

export class RegisteredProxy<T> {
  constructor(
    public readonly target: T extends ProxyInstance ? T : never,
    public readonly originThread: EProxyThread,
    public readonly tick: IEngineLoopTickContext['id']
  ) {}
}
