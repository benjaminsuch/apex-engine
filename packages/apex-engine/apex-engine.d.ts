export interface ServiceIdentifier<T> {
	(...args: any[]): void;
}
export type RegisteredService = {
	_injectibleService: undefined;
};
export type GetLeadingNonServiceArgs<TArgs extends any[]> = TArgs extends [
] ? [
] : TArgs extends [
	...infer TFirst,
	RegisteredService
] ? GetLeadingNonServiceArgs<TFirst> : TArgs;
export interface IInstatiationService {
	readonly _injectibleService: undefined;
	createInstance<C extends new (...args: any[]) => any, R extends InstanceType<C>>(Constructor: C, ...args: GetLeadingNonServiceArgs<ConstructorParameters<C>>): R;
}
declare const IInstatiationService: ServiceIdentifier<IInstatiationService>;
export type TRenderMessageType = "init" | "init-scene-proxy" | "viewport-resize";
export type TRenderMessageData<T = {
	[k: string]: unknown;
}> = {
	[P in keyof T]: T[P];
};
export type TRenderMessage<Type extends TRenderMessageType, Data> = {
	type: Type;
} & (Data extends TRenderMessageData ? TRenderMessageData<Data> : `Invalid type: 'Data' has to be of type 'object'.`);
export interface IRenderer {
	readonly _injectibleService: undefined;
	init(): void;
	send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(message: T, transferList?: Transferable[]): void;
}
declare const IRenderer: ServiceIdentifier<IRenderer>;
export interface ILogger {
	debug(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
}
export interface IConsoleLogger extends ILogger {
	readonly _injectibleService: undefined;
}
declare const IConsoleLogger: ServiceIdentifier<IConsoleLogger>;
export declare class EngineLoop {
	private readonly instantiationService;
	private readonly renderer;
	private readonly logger;
	private isExitRequested;
	constructor(instantiationService: IInstatiationService, renderer: IRenderer, logger: IConsoleLogger);
	init(): void;
	tick(): void;
	isEngineExitRequested(): boolean;
	requestExit(): void;
}
export declare abstract class ApexEngine {
	private readonly engineLoop;
	private readonly instantiationService;
	private readonly logger;
	private static instance?;
	static getInstance(): ApexEngine;
	private gameInstance?;
	getGameInstance(): GameInstance;
	isRunning: boolean;
	private isInitialized;
	constructor(engineLoop: EngineLoop, instantiationService: IInstatiationService, logger: IConsoleLogger);
	init(): void;
	tick(): void;
	start(): void;
	exit(): void;
	loadLevel(url: string): Promise<void>;
}
export declare class GameInstance {
	private readonly engine;
	private world?;
	getWorld(): World;
	constructor(engine: ApexEngine);
	init(): void;
	start(): void;
}
export declare class Level {
	private readonly instantiationService;
	private readonly renderer;
	private readonly actors;
	addActor(ActorClass: typeof Actor): Actor;
	getActors(): Actor[];
	hasActor(actor: Actor): boolean;
	world?: World;
	getWorld(): World;
	private isInitialized;
	constructor(instantiationService: IInstatiationService, renderer: IRenderer);
	init(): void;
	initActors(): void;
	beginPlay(): void;
	isCurrentLevel(): boolean;
	postLoad(): void;
}
export declare class World {
	private readonly gameInstance;
	/**
	 * Actors stored here are persistent and won't be destroyed when changing levels.
	 */
	private readonly actors;
	getActors(): Actor[];
	private currentLevel?;
	getCurrentLevel(): Level;
	setCurrentLevel(level: Level): void;
	getGameInstance(): GameInstance;
	private isInitialized;
	constructor(gameInstance: GameInstance);
	init(): void;
	initActorsForPlay(): void;
	tick(): void;
	spawnActor(ActorClass: typeof Actor, level?: Level): Actor;
}
declare class ActorComponent {
	private owner?;
	getOwner(): Actor;
	world?: World;
	getWorld(): World;
	private isInitialized;
	init(): void;
	beginPlay(): void;
	tick(): void;
	registerWithActor(actor: Actor): void;
	protected onRegister(): void;
}
declare class SceneComponent extends ActorComponent {
	private readonly position;
	private readonly scale;
	private readonly rotation;
	private readonly quaternion;
	private readonly matrix;
	private readonly matrixWorld;
	private visible;
	private readonly children;
	init(): void;
	tick(): void;
	attachToParent(parent: SceneComponent): void;
	toJSON(): any;
}
export declare class Actor {
	readonly renderer: IRenderer;
	private rootComponent?;
	setRootComponent(component: SceneComponent): void;
	getRootComponent(): SceneComponent;
	private readonly components;
	getComponents(): ActorComponent[];
	hasComponent(component: ActorComponent): boolean;
	addComponent<T extends typeof ActorComponent>(ComponentClass: T, setAsRootComponent?: boolean): InstanceType<T>;
	private level?;
	getLevel(): Level;
	private world?;
	getWorld(): World;
	private isInitialized;
	constructor(renderer: IRenderer);
	beginPlay(): void;
	tick(): void;
	preInitComponents(): void;
	initComponents(): void;
	postInitComponents(): void;
	registerWithLevel(level: Level): void;
	protected onRegister(): void;
}
export declare class GameEngine extends ApexEngine {
}
export declare class EngineUtils {
	static hasDefinedTickMethod(target: object): boolean;
}

export {};
