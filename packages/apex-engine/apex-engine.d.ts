import * as THREE from 'three';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

declare global {
  var DEFAULT_LEVEL: string;
  var IS_BROWSER: string;
  var IS_CLIENT: boolean;
  var IS_DEV: string;
  var IS_GAME: boolean;
  var IS_SERVER: boolean;
  var RENDER_ON_MAIN_THREAD: string;

  enum Thread {
    Game = 'game',
    Render = 'render'
  }

  enum EngineTarget {
    Client = 'client',
    Game = 'game',
    Server = 'server'
  }

  type TClass = { new (...args: any[]): any };

  type TypedArray =
    | typeof Float32Array
    | typeof Int8Array
    | typeof Int16Array
    | typeof Int32Array
    | typeof Uint8Array
    | typeof Uint16Array
    | typeof Uint32Array;

  type TypeOfClassMethod<T, M extends keyof T> = T[M] extends Function ? T[M] : never;

  type TKey =
    | 'AltLeft'
    | 'AltRight'
    | 'ArrowDown'
    | 'ArrowLeft'
    | 'ArrowRight'
    | 'ArrowUp'
    | 'Backquote'
    | 'ControlLeft'
    | 'ControlRight'
    | 'Digit1'
    | 'Digit2'
    | 'Digit3'
    | 'Digit4'
    | 'Digit5'
    | 'Digit6'
    | 'Digit7'
    | 'Digit8'
    | 'Digit9'
    | 'Digit0'
    | 'Equal'
    | 'KeyA'
    | 'KeyB'
    | 'KeyC'
    | 'KeyD'
    | 'KeyE'
    | 'KeyF'
    | 'KeyG'
    | 'KeyH'
    | 'KeyI'
    | 'KeyJ'
    | 'KeyK'
    | 'KeyL'
    | 'KeyM'
    | 'KeyN'
    | 'KeyO'
    | 'KeyP'
    | 'KeyQ'
    | 'KeyR'
    | 'KeyS'
    | 'KeyT'
    | 'KeyU'
    | 'KeyV'
    | 'KeyW'
    | 'KeyX'
    | 'KeyY'
    | 'KeyZ'
    | 'Minus'
    | 'MouseLeftClick'
    | 'MouseRightClick'
    | 'MouseX'
    | 'MouseY'
    | 'Space'
    | 'Tab';
}

export interface ServiceIdentifier<T> {
  (...args: any[]): void;
}
export type ServiceDependencies = {
  id: ServiceIdentifier<any>;
  index: number;
  optional: boolean;
};
export type RegisteredService = {
  _injectibleService: undefined;
};
export type GetLeadingNonServiceArgs<TArgs extends any[]> = TArgs extends []
  ? []
  : TArgs extends [...infer TFirst, RegisteredService]
  ? GetLeadingNonServiceArgs<TFirst>
  : TArgs;
export type SingletonRegistry = [ServiceIdentifier<any>, new (...services: any[]) => any][];
export declare class ServiceCollection {
  private readonly entries;
  constructor(...entries: [ServiceIdentifier<any>, any][]);
  set<T>(id: ServiceIdentifier<T>, instance: T): T;
  has(id: ServiceIdentifier<any>): boolean;
  get<T>(id: ServiceIdentifier<T>): T;
}
export interface ServicesAccessor {
  get<T>(id: ServiceIdentifier<T>): T;
}
export interface IInstatiationService {
  readonly _injectibleService: undefined;
  createInstance<C extends new (...args: any[]) => any, R extends InstanceType<C>>(
    Constructor: C,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<C>>
  ): R;
  invokeFunction<R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ): R;
  setServiceInstance<T>(id: ServiceIdentifier<T>, instance: T): void;
}
export declare class InstantiationService implements IInstatiationService {
  private readonly services;
  readonly _injectibleService: undefined;
  private static readonly registeredServices;
  private static registerServiceDependency;
  private static getServiceDependencies;
  static createDecorator<T>(serviceId: string): ServiceIdentifier<T>;
  private static readonly singletonRegistry;
  static registerSingleton<T, Services extends RegisteredService[]>(
    id: ServiceIdentifier<T>,
    Constructor: new (...services: Services) => T
  ): void;
  static getSingletonServices(): SingletonRegistry;
  constructor(services?: ServiceCollection);
  createInstance<C extends new (...args: any[]) => any, R extends InstanceType<C>>(
    Constructor: C,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<C>>
  ): R;
  invokeFunction<R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ): R;
  setServiceInstance<T>(id: ServiceIdentifier<T>, instance: T): void;
}
export declare const IInstatiationService: ServiceIdentifier<IInstatiationService>;
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
}
export declare abstract class AbstractLogger implements ILogger {
  abstract debug(message: string, ...args: any[]): void;
  abstract error(message: string, ...args: any[]): void;
  abstract info(message: string, ...args: any[]): void;
  abstract warn(message: string, ...args: any[]): void;
}
export declare class ConsoleLogger extends AbstractLogger implements IConsoleLogger {
  readonly _injectibleService: undefined;
  debug(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
}
export interface IConsoleLogger extends ILogger {
  readonly _injectibleService: undefined;
}
export declare const IConsoleLogger: ServiceIdentifier<IConsoleLogger>;
export declare class TripleBuffer {
  readonly flags: Uint8Array;
  readonly byteLength: number;
  readonly buffers: SharedArrayBuffer[];
  readonly byteViews: Uint8Array[];
  static getReadBufferIndexFromFlags(flags: Uint8Array): number;
  static swapWriteBufferFlags(flags: Uint8Array): void;
  static swapReadBufferFlags(flags: Uint8Array): boolean;
  private static swapWriteWithTempAndMarkChanged;
  private static readyToRead;
  private static swapReadWithTemp;
  constructor(
    flags?: Uint8Array,
    byteLength?: number,
    buffers?: SharedArrayBuffer[],
    byteViews?: Uint8Array[]
  );
  getReadBufferIndex(): number;
  getReadBuffer(): SharedArrayBuffer;
  getReadView(): Uint8Array;
  getWriteBufferIndex(): number;
  getWriteBuffer(): SharedArrayBuffer;
  copyToWriteBuffer(byteView: Uint8Array): void;
  swapReadBuffer(): boolean;
  swapWriteBuffer(): void;
}
export type TRenderMessageType = 'init' | 'proxy' | 'rpc' | 'set-camera' | 'viewport-resize';
export type TRenderMessageData<
  T = {
    [k: string]: unknown;
  }
> = {
  [P in keyof T]: T[P];
};
export type TRenderMessage<Type extends TRenderMessageType, Data> = {
  type: Type;
} & (Data extends TRenderMessageData
  ? TRenderMessageData<Data>
  : `Invalid type: 'Data' has to be of type 'object'.`);
export interface TRenderWorkerInitData {
  canvas: OffscreenCanvas;
  initialCanvasHeight: number;
  initialCanvasWidth: number;
  messagePort: MessagePort;
  flags: Uint8Array;
}
export type TRenderWorkerInitMessage = TRenderMessage<'init', TRenderWorkerInitData>;
export type TRenderViewportResizeData = TRenderMessageData<{
  height: number;
  width: number;
}>;
export type TRenderViewportResizeMessage = TRenderMessage<
  'viewport-resize',
  TRenderViewportResizeData
>;
export type TTripleBufferData = Pick<
  TripleBuffer,
  'buffers' | 'byteLength' | 'byteViews' | 'flags'
>;
export type TRenderSceneProxyCreateData = TRenderMessageData<{
  constructor: string;
  id: number;
  tb: Pick<TripleBuffer, 'buffers' | 'byteLength' | 'byteViews' | 'flags'>;
}>;
export type TRenderSceneProxyMessage = TRenderMessage<'proxy', TRenderSceneProxyCreateData>;
export type TRenderRPCData = TRenderMessageData<{
  id: number;
  action: string;
  params: unknown[];
}>;
export type TRenderRPCMessage = TRenderMessage<'rpc', TRenderRPCData>;
export interface IRenderer {
  readonly _injectibleService: undefined;
  init(flags: Uint8Array): void;
  send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList?: Transferable[]
  ): void;
}
export declare const IRenderer: ServiceIdentifier<IRenderer>;
export declare class Renderer {
  private readonly flags;
  private readonly messagePort;
  private readonly components;
  private readonly logger;
  private static instance?;
  static getInstance(): Renderer;
  static create(
    canvas: OffscreenCanvas,
    flags: Uint8Array,
    messagePort: MessagePort,
    components: Record<string, TClass>
  ): Renderer;
  private readonly proxyInstancesRegistry;
  private readonly proxyInstances;
  private readonly webGLRenderer;
  private readonly scene;
  private readonly camera;
  constructor(
    canvas: OffscreenCanvas,
    flags: Uint8Array,
    messagePort: MessagePort,
    components: Record<string, TClass>,
    logger: IConsoleLogger
  );
  init(): void;
  start(): void;
  setSize(height: number, width: number): void;
  handleEvent(event: MessageEvent<TRenderSceneProxyMessage | TRenderRPCMessage>): void;
  private tick;
  private createProxyInstance;
}
export interface Tick {
  delta: number;
  elapsed: number;
}
export declare class EngineLoop {
  private readonly instantiationService;
  private readonly renderer;
  private readonly logger;
  private isExitRequested;
  private tickInterval;
  delta: number;
  elapsed: number;
  frames: number;
  fps: number;
  constructor(
    instantiationService: IInstatiationService,
    renderer: IRenderer,
    logger: IConsoleLogger
  );
  init(): void;
  tick(): void;
  isEngineExitRequested(): boolean;
  requestExit(): void;
}
export declare class Pawn extends Actor {
  controller: PlayerController | null;
  inputComponent: InputComponent | null;
  possessBy(player: PlayerController): void;
  unpossessed(): void;
  restart(): void;
  protected setupInputComponent(): void;
}
export declare class PlayerInput {
  private readonly keyStates;
  private readonly axisMappings;
  private readonly axisKeyMap;
  private readonly actionMappings;
  private readonly actionKeyMap;
  private isKeyMapBuilt;
  constructor();
  processInputStack(inputStack: InputComponent[], delta: number): void;
  getKeyValue(key: TKey): number;
  getKeyRawValue(key: TKey): number;
  addMapping(mapping: InputActionMap | InputAxisMap): boolean;
  handleEvent(event: KeyboardEvent | MouseEvent | PointerEvent | TouchEvent): void;
  private handleContextMenu;
  private handleMouseMove;
  private handleMouseDown;
  private handleMouseUp;
  private handleKeyDown;
  private handleKeyUp;
  private determineAxisValue;
  private buildKeyMappings;
}
export declare class InputActionMap {
  readonly name: string;
  readonly key: TKey;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  cmd: boolean;
  constructor(
    name: string,
    key: TKey,
    shift?: boolean,
    ctrl?: boolean,
    alt?: boolean,
    cmd?: boolean
  );
}
export declare class InputAxisMap {
  readonly name: string;
  readonly key: TKey;
  readonly scale: number;
  constructor(name: string, key: TKey, scale: number);
}
export declare class KeyState {
  rawValue: Vector3;
  value: Vector3;
  isPressed: boolean;
  isConsumed: boolean;
  lastUsedTime: number;
  sampleCount: number;
  constructor(rawValue: Vector3, value: Vector3, isPressed?: boolean, isConsumed?: boolean);
}
export declare enum EKeyEvent {
  DoubleClick = 0,
  Pressed = 1,
  Released = 2
}
export declare class PlayerController extends Actor {
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  readonly renderer: IRenderer;
  protected pawn: Pawn | null;
  getPawn(): Pawn;
  setPawn(pawn: PlayerController['pawn']): void;
  protected camera?: any;
  readonly playerInput: PlayerInput;
  constructor(
    instantiationService: IInstatiationService,
    logger: IConsoleLogger,
    renderer: IRenderer
  );
  tick(tick: Tick): void;
  beginPlay(): void;
  possess(pawn: Pawn): void;
  unpossess(): void;
  private buildInputStack;
}
declare class Player {
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  playerController: PlayerController | null;
  getPlayerController(): PlayerController;
  constructor(instantiationService: IInstatiationService, logger: IConsoleLogger);
  spawnPlayActor(world: World): void;
}
declare class ControlChannel extends DataChannel {}
declare class VoiceChannel extends DataChannel {}
declare enum EConnectionState {
  Pending = 0,
  Open = 1,
  Closed = 2
}
declare class NetConnection extends Player {
  private packetHandler;
  netDriver: INetDriver | null;
  controlChannel: ControlChannel | null;
  voiceChannel: VoiceChannel | null;
  readonly openChannels: DataChannel[];
  readonly tickChannels: DataChannel[];
  state: EConnectionState;
  init(netDriver: INetDriver): void;
  receiveRawPacket(packet: ArrayBuffer): void;
  close(): void;
  tick(): void;
  flush(): void;
  private createInitialChannels;
  private initPacketHandler;
}
declare class DataChannel {
  connection: NetConnection | null;
  isClosing: boolean;
  init(connection: NetConnection): void;
  close(): void;
  send(): void;
  tick(): void;
}
declare class PacketHandler {
  protected readonly logger: IConsoleLogger;
  private readonly handlerComponents;
  isInitialized: boolean;
  constructor(logger: IConsoleLogger);
  init(): void;
  incomingPacket(packet: ArrayBuffer): ArrayBuffer;
  tick(): void;
  getQueuedPackets(): never[];
}
export interface INetDriver {
  readonly _injectibleService: undefined;
  packetHandler: PacketHandler | null;
  world: World | null;
  close(): void;
  connect(): void;
  disconnect(): void;
  init(world: World): void;
  join(): void;
  listen(): void;
  tick(): void;
  send(data: ArrayBufferLike): void;
}
export declare const INetDriver: ServiceIdentifier<INetDriver>;
export declare abstract class WebSocketNetDriverBase implements INetDriver {
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  readonly _injectibleService: undefined;
  packetHandler: PacketHandler | null;
  world: World | null;
  constructor(instantiationService: IInstatiationService, logger: IConsoleLogger);
  init(world: World): void;
  listen(): void;
  connect(): void;
  disconnect(): void;
  createChannel(Class: typeof DataChannel): DataChannel;
  close(): void;
  join(): void;
  tick(): void;
  send(data: ArrayBufferLike): void;
  handleEvent(event: Event | MessageEvent): void;
}
export declare abstract class ApexEngine {
  protected readonly engineLoop: EngineLoop;
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  protected readonly renderer: IRenderer;
  private static instance?;
  static getInstance(): ApexEngine;
  private gameInstance?;
  getGameInstance(): GameInstance;
  static GAME_FLAGS: Uint8Array;
  isRunning: boolean;
  isInitialized: boolean;
  constructor(
    engineLoop: EngineLoop,
    instantiationService: IInstatiationService,
    logger: IConsoleLogger,
    renderer: IRenderer
  );
  init(): void;
  tick(tick: Tick): void;
  start(): void;
  exit(): void;
  loadLevel(url: string): Promise<void>;
}
export declare class GameMode extends Actor {
  readonly playerPawnClass: typeof Pawn;
  readonly playerControllerClass: typeof PlayerController;
  preLogin(): void;
  login(): PlayerController;
  postLogin(player: PlayerController): void;
  restartPlayer(playerController: PlayerController, transform?: Matrix4): void;
  findPlayerStartLocation(): Matrix4;
  spawnPlayerController(): PlayerController;
  spawnDefaultPlayerPawn(): Pawn;
  welcomePlayer(connection: NetConnection): void;
  private initPlayer;
}
export declare class GameInstance {
  private readonly engine;
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  protected readonly netDriver: INetDriver;
  private defaultGameModeClass;
  private gameModeClassAliases;
  private world;
  getWorld(): World;
  private player;
  getPlayer(): Player;
  constructor(
    engine: ApexEngine,
    instantiationService: IInstatiationService,
    logger: IConsoleLogger,
    netDriver: INetDriver
  );
  init(): void;
  start(): void;
  createPlayer(withPlayerController?: boolean): void;
  createGameModeFromURL(url: string): Promise<GameMode>;
  private getGameModeByName;
}
export declare class GameModeMap {
  readonly name: string;
  readonly classFilePath: string;
  constructor(name: string, classFilePath: string);
}
export declare class Level {
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  protected readonly renderer: IRenderer;
  readonly actors: Set<Actor>;
  addActor<T extends typeof Actor>(ActorClass: T): InstanceType<T>;
  removeActor(actor: Actor): void;
  hasActor(actor: Actor): boolean;
  world?: World;
  getWorld(): World;
  isInitialized: boolean;
  constructor(
    instantiationService: IInstatiationService,
    logger: IConsoleLogger,
    renderer: IRenderer
  );
  init(): void;
  initActors(): void;
  beginPlay(): void;
  isCurrentLevel(): boolean;
  postLoad(world: World): void;
  dispose(): void;
}
export declare class World {
  protected readonly logger: IConsoleLogger;
  protected readonly netDriver: INetDriver;
  private readonly playerControllers;
  addPlayerController(controller: PlayerController): void;
  removePlayerController(controller: PlayerController): void;
  readonly actors: Set<Actor>;
  currentLevel: Level | null;
  getCurrentLevel(): Level;
  setCurrentLevel(level: Level): void;
  private gameMode;
  setGameMode(url: string): Promise<void>;
  getGameMode(): GameMode;
  private gameInstance;
  getGameInstance(): GameInstance;
  isInitialized: boolean;
  constructor(logger: IConsoleLogger, netDriver: INetDriver);
  init(gameInstance: GameInstance): void;
  initActorsForPlay(): void;
  beginPlay(): void;
  cleanUp(): void;
  tick(tick: Tick): void;
  spawnActor<T extends typeof Actor>(ActorClass: T, level?: Level | null): InstanceType<T>;
  destroyActor(actor: Actor): void;
  spawnPlayActor(player: Player): PlayerController;
  welcomePlayer(connection: NetConnection): void;
}
export declare class ActorComponent {
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  readonly uuid: string;
  private owner?;
  getOwner(): Actor;
  world?: World;
  getWorld(): World;
  isInitialized: boolean;
  constructor(instantiationService: IInstatiationService, logger: IConsoleLogger);
  init(): void;
  beginPlay(): void;
  tick(tick: Tick): void;
  registerWithActor(actor: Actor): void;
  dispose(): void;
  protected onRegister(): void;
}
export declare abstract class SceneProxy {
  readonly id: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  matrix: [number, number, number, number];
  up: [number, number, number];
  constructor(id: number, tb: TripleBuffer);
  tick(time: number): void;
}
export type SceneObjectType = 'Box' | 'Object3D' | 'PerspectiveCamera';
export declare class SceneComponent extends ActorComponent {
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  matrix: Matrix4;
  quaternion: Quaternion;
  up: Vector3;
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  parent: SceneComponent | null;
  childIndex: number;
  children: SceneComponent[];
  attachToComponent(parent: SceneComponent): true | undefined;
  detachFromParent(parent: SceneComponent): true | undefined;
  detachFromComponent(component: SceneComponent): true | undefined;
  isAttachedTo(component: SceneComponent): boolean;
}
export declare class MeshComponentProxy extends SceneProxy {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  mesh: THREE.Mesh;
  constructor(id: number, tb: TripleBuffer);
  tick(time: number): void;
}
export declare class MeshComponent extends SceneComponent {
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  protected readonly renderer: IRenderer;
  constructor(
    instantiationService: IInstatiationService,
    logger: IConsoleLogger,
    renderer: IRenderer
  );
}
export declare class BoxComponentProxy extends MeshComponentProxy {
  positions: Float32Array;
  normals: Float32Array;
  private segmentsAround;
  tick(time?: number): void;
  makeSpherePositions(segmentsAround: number, segmentsDown: number): void;
}
export declare class BoxComponent extends MeshComponent {
  makeSpherePositions(segmentsAround: number, segmentsDown: number): void;
}
export declare class CameraComponent extends SceneComponent {
  #private;
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  get fov(): number;
  set fov(val: number);
  get aspect(): number;
  set aspect(val: number);
  get far(): number;
  set far(val: number);
  get near(): number;
  set near(val: number);
  constructor(instantiationService: IInstatiationService, logger: IConsoleLogger);
}
export declare class InputComponent extends ActorComponent {
  readonly actionBindings: InputActionBinding[];
  readonly axisBindings: InputAxisBinding[];
  blockInput: boolean;
  buildKeyMap(): void;
  bindAxis<T extends Actor>(name: InputAxisBinding['name'], ref: T, fn: Function): void;
  unbindAxis(name: InputAxisBinding['name']): void;
  bindAction<T extends Actor>(
    name: InputActionBinding['name'],
    ref: T,
    fn: Function,
    event: EKeyEvent
  ): void;
  unbindAction(name: InputActionBinding['name']): void;
}
export declare class InputBinding {
  consumeInput: boolean;
  executeWhenPaused: boolean;
}
export declare class InputActionBinding extends InputBinding {
  readonly name: string;
  readonly handle: Function;
  readonly event: EKeyEvent;
  constructor(name: string, handle: Function, event: EKeyEvent);
}
export declare class InputAxisBinding extends InputBinding {
  readonly name: string;
  readonly handle: Function;
  value: number;
  constructor(name: string, handle: Function, value?: number);
}
export type ActorComponentType = new (...args: any[]) => ActorComponent;
export declare class Actor {
  protected readonly instantiationService: IInstatiationService;
  protected readonly logger: IConsoleLogger;
  readonly renderer: IRenderer;
  private rootComponent?;
  setRootComponent(component: SceneComponent): void;
  getRootComponent(): SceneComponent;
  readonly components: Set<ActorComponent>;
  getComponent<T extends ActorComponentType>(ComponentClass: T): InstanceType<T> | undefined;
  hasComponent(component: ActorComponent): boolean;
  addComponent<T extends ActorComponentType, R extends InstanceType<T>>(
    ComponentClass: T,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<T>>
  ): R;
  private level?;
  getLevel(): Level;
  private world?;
  getWorld(): World;
  isInitialized: boolean;
  constructor(
    instantiationService: IInstatiationService,
    logger: IConsoleLogger,
    renderer: IRenderer
  );
  beginPlay(): void;
  tick(tick: Tick): void;
  preInitComponents(): void;
  initComponents(): void;
  postInitComponents(): void;
  registerWithLevel(level: Level): void;
  dispose(): void;
  protected onRegister(): void;
}
export declare class GameEngine extends ApexEngine {}
export declare class EngineUtils {
  static hasDefinedTickMethod(target: object): boolean;
}
export type ClassDecoratorFunction = (constructor: TClass) => TClass;
export declare function CLASS(
  ...classFns: ClassDecoratorFunction[]
): <T extends TClass>(constructor: T, ...rest: unknown[]) => T;
export declare function PROP(
  ...args: Function[]
): (target: InstanceType<TClass>, prop: string | symbol) => void;
export interface Schema {
  [key: string]: {
    arrayType: TypedArray;
    isArray: boolean;
    offset: number;
    pos: number;
    size: number;
    type: string;
  };
}
export declare function getClassSchema(constructor: TClass): Schema | undefined;
export declare function addPropToSchema(constructor: TClass, prop: string | symbol): void;
export declare function getPropFromSchema(constructor: TClass, prop: string | symbol): any;
export declare function setPropOnSchema(
  constructor: TClass,
  prop: string | symbol,
  key: string,
  value: any
): void;
export declare function getTargetId(target: InstanceType<TClass>): undefined | number;

export {};
