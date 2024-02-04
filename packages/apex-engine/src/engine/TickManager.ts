import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type World } from './World';

export enum ETickGroup {
  PrePhysics,
  DuringPhysics,
  PostPhysics,
  MAX,
}

export class TickManager {
  private static instance?: TickManager;

  public static getInstance(): TickManager {
    if (!this.instance) {
      throw new Error(`No instance of TickManager available.`);
    }
    return this.instance;
  }

  /**
   * Contains all tick functions, unsorted, in the order they have been added.
   */
  private readonly registeredTickFunctions: TickFunction<any>[] = [];

  /**
   * Stores all tick functions that have `canTick` set to `true`.
   */
  private readonly enabledTickFunctions: TickFunction<any>[] = [];

  /**
   * Stores the tick functions by tick group, sorted in a topologial order.
   */
  private readonly tickGroups: TickFunction<any>[][] = [];

  /**
   * Will be set at the start of `startTick`.
   */
  private world?: World;

  public getWorld(): World {
    if (!this.world) {
      throw new Error(`Trying to access world before it has been assigned.`);
    }
    return this.world;
  }

  /**
   * Will be set at the start of `startTick` and will be passed to `TickFunction.run`.
   */
  private currentTick: IEngineLoopTickContext = { id: 0, delta: 0, elapsed: 0 };

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (TickManager.instance) {
      throw new Error(`An instance of TickManager already exists.`);
    }

    for (let i = 0; i < ETickGroup.MAX; ++i) {
      this.tickGroups.push([]);
    }
    // console.log('TickManager', this);
    TickManager.instance = this;
  }

  public addTickFunction<T extends TickFunction<any>>(tickFunction: T): boolean {
    if (!this.registeredTickFunctions.includes(tickFunction)) {
      tickFunction.isRegistered = true;
      tickFunction.index = this.registeredTickFunctions.push(tickFunction) - 1;

      if (tickFunction.canTick) {
        this.enabledTickFunctions.push(tickFunction);
      }

      return true;
    }
    return false;
  }

  public enableTickFunction<T extends TickFunction<any>>(tickFunction: T): boolean {
    if (!tickFunction.canTick) {
      tickFunction.canTick = true;
      this.enabledTickFunctions.push(tickFunction);
    }
    return false;
  }

  public disableTickFunction<T extends TickFunction<any>>(tickFunction: T): boolean {
    const idx = this.enabledTickFunctions.indexOf(tickFunction);

    if (tickFunction.canTick && idx > -1) {
      tickFunction.canTick = false;
      this.enabledTickFunctions.removeAtSwap(idx);
    }

    return false;
  }

  /**
   * Creates a topological order of `enabledTickFunctions` and stores it in `tickGroups`.
   *
   * @param context
   * @param world
   */
  public startTick(context: IEngineLoopTickContext, world?: World): void {
    if (world && !this.world) {
      this.world = world;
    }

    this.currentTick = context;

    // We do topological sorting using Kahn's algorithm (https://en.wikipedia.org/wiki/Topological_sorting)
    for (let i = 0; i < this.enabledTickFunctions.length; ++i) {
      const tickFunction = this.enabledTickFunctions[i];
      const dependencies = tickFunction.dependencies;

      for (let j = 0; j < dependencies.length; ++j) {
        const dependency = this.registeredTickFunctions[dependencies[j].index];

        if (dependency.tickGroup <= tickFunction.tickGroup) {
          dependency.indegree++;
        }
      }
    }

    const queue: TickFunction<any>[] = [];

    for (let i = 0; i < this.enabledTickFunctions.length; ++i) {
      const tickFunction = this.enabledTickFunctions[i];

      if (tickFunction.indegree === 0) {
        queue.push(tickFunction);
      }
    }

    let iterations = 0;
    let tickFunction: undefined | TickFunction<any>;

    while (tickFunction = queue.shift()) {
      if (tickFunction.canTick) {
        this.tickGroups[tickFunction.tickGroup].push(tickFunction);
      }

      for (let i = 0; i < tickFunction.dependencies.length; ++i) {
        const dependency = tickFunction.dependencies[i];
        const node = this.registeredTickFunctions[dependency.index];

        if (node && --node.indegree === 0) {
          queue.push(node);
        }
      }

      iterations++;
    }

    if (iterations !== this.enabledTickFunctions.length) {
      throw Error(`Dependency cycle detected.`);
    }
  }

  public endTick(): void {
    for (let i = 0; i < ETickGroup.MAX; ++i) {
      this.tickGroups[i] = [];
    }
  }

  // todo: Should we push rejected tasks into the next tick?
  public async runTickGroup(group: ETickGroup): Promise<void> {
    for (let i = 0; i < this.tickGroups[group].length; ++i) {
      const tickFunction = this.tickGroups[group][i];
      // todo: Silently reject when the tick is about to end or the function is taking too long
      // todo: Trigger event "FunctionTaskCompletion"
      await tickFunction.run(this.currentTick);
    }
  }
}

export class TickFunction<T> {
  /**
   * A list of tick functions that this tick function depends on.
   *
   * Important: If one of the dependencies is in an earlier tick group,
   * that dependency will be ignored! Make sure a dependency is in the same
   * or later tick group.
   */
  public readonly dependencies: TickFunction<any>[] = [];

  public isRegistered: boolean = false;

  /**
   * The value should be set before the function is being registered. If it has
   * been registered, use `enable` or `disable` instead.
   *
   * Must be set to `true` if you want to add dependencies.
   *
   * @default false
   */
  public canTick: boolean = false;

  /**
   * Tick functions are, by default, not executed while the game is paused.
   * If set to `true`, the tick function will keep getting executed during the pause.
   *
   * @default false
   */
  public canTickWhenPaused: boolean = false;

  public tickGroup: ETickGroup = ETickGroup.PrePhysics;

  /**
   * The index of where this tick function is stored.
   *
   * @default 0
   */
  public index: number = 0;

  /**
   * The number of tick functions that depend on this tick function.
   *
   * @default 0
   */
  public indegree: number = 0;

  constructor(
    public readonly target: T,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public run(context: IEngineLoopTickContext): void | Promise<void> {}

  /**
   * It will push the tick function onto the stack of enabled tick functions.
   *
   * Note: This should be used sparely, as it re-orders the whole stack of
   * enabled tick functions.
   *
   * @returns `true` if successful, `false` otherwise
   */
  public enable(): boolean {
    return TickManager.getInstance().enableTickFunction(this);
  }

  /**
   * Disabling it, so it won't be called during the `tick`.
   *
   * Note: This should be used sparely, as it re-orders the whole stack of
   * enabled tick functions. Instead make sure that `canTick`
   *
   * @returns `true` if successful, `false` otherwise
   */
  public disable(): boolean {
    return TickManager.getInstance().disableTickFunction(this);
  }

  public register(): boolean {
    if (!this.isRegistered) {
      return TickManager.getInstance().addTickFunction(this);
    }
    return false;
  }

  /**
   * Adds a tick function dependency if both, the target and the parameter have
   * `canTick` set to `true`.
   *
   * @param tickFunction
   * @returns `true` if successful, `false` otherwise
   */
  public addDependency<T extends TickFunction<any>>(tickFunction: T): boolean {
    if (this.canTick && tickFunction.canTick) {
      if (!this.dependencies.includes(tickFunction)) {
        this.dependencies.push(tickFunction);
        return true;
      }
    }
    return false;
  }

  /**
   * Removes the dependency from the tick function.
   *
   * @param tickFunction
   * @returns `true` if successful
   */
  public removeDependency<T extends TickFunction<any>>(tickFunction: T): boolean {
    const idx = this.dependencies.indexOf(tickFunction);

    if (idx > -1) {
      this.dependencies.removeAtSwap(idx);
      return true;
    }

    return false;
  }
}
