import { Plugin } from 'rollup';
import { Object3D, PerspectiveCamera } from 'three';

export type BuildPlugin = Plugin | Promise<Plugin>;
export interface BuildConfig {
	outDir?: string;
	plugins?: BuildPlugin[];
}
export type Platform = "browser" | "electron" | "node";
export type Target = "client" | "game" | "server";
export interface TargetConfig {
	defaultLevel: string;
	platform: Platform;
	target: Target;
}
export interface ApexConfig {
	build?: BuildConfig;
	targets: TargetConfig[];
}
export declare function defineConfig(config: ApexConfig): ApexConfig;
export interface ILogger {
	debug(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
}
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
export interface IConsoleLogger extends ILogger {
	readonly _injectibleService: undefined;
}
declare const IConsoleLogger: ServiceIdentifier<IConsoleLogger>;
export interface IInstatiationService {
	readonly _injectibleService: undefined;
	createInstance<C extends new (...args: any[]) => any, R extends InstanceType<C>>(Constructor: C, ...args: GetLeadingNonServiceArgs<ConstructorParameters<C>>): R;
}
declare const IInstatiationService: ServiceIdentifier<IInstatiationService>;
export type TRenderMessageType = "init" | "init-scene-proxy" | "set-camera" | "viewport-resize";
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
	protected readonly instantiationService: IInstatiationService;
	protected readonly renderer: IRenderer;
	private readonly actors;
	addActor<T extends typeof Actor>(ActorClass: T): InstanceType<T>;
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
	beginPlay(): void;
	tick(): void;
	spawnActor<T extends typeof Actor>(ActorClass: T, level?: Level): InstanceType<T>;
}
export declare class ActorComponent {
	readonly uuid: string;
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
export declare class Euler {
	#private;
	static readonly ORDER_LIST: readonly [
		"XYZ",
		"XZY",
		"YZX",
		"YXZ",
		"ZXY",
		"ZYX"
	];
	static readonly DEFAULT_ORDER = "XYZ";
	get x(): number;
	set x(val: number);
	get y(): number;
	set y(val: number);
	get z(): number;
	set z(val: number);
	get order(): "XYZ" | "YXZ" | "ZXY" | "ZYX" | "YZX" | "XZY";
	set order(val: "XYZ" | "YXZ" | "ZXY" | "ZYX" | "YZX" | "XZY");
	isEuler: boolean;
	constructor(buffer?: ArrayBufferLike);
	set(x: Euler["x"], y: Euler["y"], z: Euler["z"], order: Euler["order"]): this;
	clone(): Euler;
	copy(euler: Euler): this;
	setFromRotationMatrix(): void;
	setFromQuaternion(): void;
	setFromVector3(): void;
	reorder(): void;
	equals(euler: Euler): boolean;
	fromArray(array: number[]): this;
	toArray(array?: number[], offset?: number): number[];
	toJSON(): ArrayBufferLike;
	[Symbol.iterator](): Generator<number | "XYZ" | "YXZ" | "ZXY" | "ZYX" | "YZX" | "XZY", void, unknown>;
}
export declare class Vector3 {
	#private;
	get x(): number;
	set x(val: number);
	get y(): number;
	set y(val: number);
	get z(): number;
	set z(val: number);
	isVector3: boolean;
	constructor(buffer?: ArrayBufferLike);
	toJSON(): ArrayBufferLike;
	fromArray(array: ArrayLike<number>, offset?: number): this;
	toArray(): [
		number,
		number,
		number
	];
	set(x: Vector3["x"], y: Vector3["y"], z: Vector3["z"]): this;
	setX(x: Vector3["x"]): this;
	setY(y: Vector3["y"]): this;
	setZ(z: Vector3["z"]): this;
	clone(): Vector3;
	copy(vec: Vector3): this;
	add(vec: Vector3): this;
	addScalar(val: number): this;
	addVectors(a: Vector3, b: Vector3): this;
	sub(vec: Vector3): this;
	subScalar(val: number): this;
	multiply(vec: Vector3): this;
	multiplyScalar(val: number): this;
	multiplyVectors(a: Vector3, b: Vector3): this;
	divide(vec: Vector3): this;
	divideScalar(val: number): this;
	clamp(min: Vector3, max: Vector3): this;
	clampScalar(min: number, max: number): this;
	ceil(): this;
	floor(): this;
	round(): this;
	roundToZero(): this;
	negate(): this;
	dot(v: Vector3): number;
	length(): number;
	setFromMatrixColumn(matrix: Matrix4, index: number): this;
	setFromMatrix3Column(matrix: Matrix3, index: number): this;
	setFromEuler(euler: Euler): this;
	equals(vector: Vector3): boolean;
	random(): this;
	randomDirection(): this;
	[Symbol.iterator](): Generator<number, void, unknown>;
}
export declare class Matrix4 {
	#private;
	get elements(): Float32Array;
	isMatrix4: boolean;
	constructor(buffer?: ArrayBufferLike);
	set(n11: number, n12: number, n13: number, n14: number, n21: number, n22: number, n23: number, n24: number, n31: number, n32: number, n33: number, n34: number, n41: number, n42: number, n43: number, n44: number): this;
	identity(): this;
	clone(): Matrix4;
	copy(matrix: Matrix4): this;
	copyPosition(matrix: Matrix4): this;
	setFromMatrix3(matrix: Matrix4): this;
	extractBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this;
	makeBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this;
	makeRotationFromEuler(euler: Euler): this;
	multiply(matrix: Matrix4): this;
	premultiply(matrix: Matrix4): this;
	multiplyMatrices(a: Matrix4, b: Matrix4): this;
	multiplyScalar(scalar: number): this;
	determinant(): number;
	transpose(): this;
	setPosition(x: Vector3 | number, y: number, z: number): this;
	invert(): this;
	scale(vector: Vector3): this;
	getMaxScaleOnAxis(): number;
	makeTranslation(x: number, y: number, z: number): this;
	makeRotationX(theta: number): this;
	makeRotationY(theta: number): this;
	makeRotationZ(theta: number): this;
	makeRotationAxis(axis: Vector3, angle: number): this;
	makeScale(x: number, y: number, z: number): this;
	makeShear(xy: number, xz: number, yx: number, yz: number, zx: number, zy: number): this;
	makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number): this;
	makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number): this;
	equals(matrix: Matrix4): boolean;
	fromArray(array: number[], offset?: number): this;
	toArray(array?: number[], offset?: number): number[];
	toJSON(): ArrayBufferLike;
}
export declare class Matrix3 {
	#private;
	get elements(): Float32Array;
	isMatrix3: boolean;
	constructor(buffer?: ArrayBufferLike);
	set(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number): this;
	identity(): this;
	copy(matrix: Matrix3): this;
	extractBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this;
	setFromMatrix4(matrix: Matrix4): this;
	multiply(matrix: Matrix3): this;
	premultiply(matrix: Matrix3): this;
	multiplyMatrices(a: Matrix3, b: Matrix3): this;
	multiplyScalar(scalar: number): this;
	determinant(): number;
	invert(): this;
	transpose(): this;
	getNormalMatrix(matrix4: Matrix4): this;
	transposeIntoArray(array: number[]): this;
	setUvTransform(tx: number, ty: number, sx: number, sy: number, rotation: number, cx: number, cy: number): this;
	scale(x: number, y: number): this;
	rotate(theta: number): this;
	translate(x: number, y: number): this;
	makeTranslation(x: number, y: number): this;
	makeRotation(theta: number): this;
	makeScale(x: number, y: number): this;
	equals(matrix: Matrix3): boolean;
	fromArray(array: number[], offset?: number): this;
	toArray(array?: number[], offset?: number): number[];
	toJSON(): ArrayBufferLike;
	clone(): Matrix3;
}
export declare class Quaternion {
	#private;
	static slerpFlat(dst: number[], dstOffset: number, src0: number[], srcOffset0: number, src1: number[], srcOffset1: number, t: number): void;
	static multiplyQuaternionsFlat(dst: number[], dstOffset: number, src0: number[], srcOffset0: number, src1: number[], srcOffset1: number): number[];
	get x(): number;
	set x(val: number);
	get y(): number;
	set y(val: number);
	get z(): number;
	set z(val: number);
	get w(): number;
	set w(val: number);
	isQuaternion: boolean;
	constructor(buffer?: ArrayBufferLike);
	set(x: number, y: number, z: number, w: number): this;
	clone(): Quaternion;
	copy(quaternion: Quaternion): this;
	setFromEuler(euler: Euler): this;
	setFromAxisAngle(axis: Vector3, angle: number): this;
	setFromRotationMatrix(matrix: Matrix3): this;
	setFromUnitVectors(from: Vector3, to: Vector3): this;
	angleTo(quaternion: Quaternion): number;
	rotateTowards(quaternion: Quaternion, step: number): this;
	identity(): this;
	invert(): this;
	conjugate(): this;
	dot(v: any): number;
	lengthSq(): number;
	length(): number;
	normalize(): this;
	multiply(quaternion: Quaternion): this;
	premultiply(quaternion: Quaternion): this;
	multiplyQuaternions(a: Quaternion, b: Quaternion): this;
	slerp(quaternion: Quaternion, t: number): this;
	slerpQuaternions(a: Quaternion, b: Quaternion, t: number): this;
	random(): this;
	equals(quaternion: Quaternion): boolean;
	fromArray(array: number[], offset?: number): this;
	toArray(array?: number[], offset?: number): number[];
	fromBufferAttribute(attribute: any, index: any): this;
	toJSON(): ArrayBufferLike;
	[Symbol.iterator](): Generator<number, void, unknown>;
}
export interface SceneProxyConstructorData {
	uuid: string;
	objectType: SceneObjectType;
	position: ArrayBufferLike;
	scale: ArrayBufferLike;
	rotation: ArrayBufferLike;
	quaternion: ArrayBufferLike;
	matrix: ArrayBufferLike;
	matrixWorld: ArrayBufferLike;
	visible: boolean;
	children: SceneProxyConstructorData[];
}
export declare class SceneProxy {
	readonly uuid: string;
	readonly position: Vector3;
	readonly scale: Vector3;
	readonly rotation: Euler;
	readonly quaternion: Quaternion;
	readonly matrix: Matrix4;
	readonly matrixWorld: Matrix4;
	visible: boolean;
	readonly sceneObject: Object3D;
	constructor({ position, scale, rotation, quaternion, matrix, matrixWorld, uuid }: SceneProxyConstructorData);
	tick(): void;
}
export interface CameraProxyConstructorData extends SceneProxyConstructorData {
	buffer: ArrayBufferLike;
}
export declare class CameraSceneProxy extends SceneProxy {
	#private;
	fov: number;
	aspect: number;
	far: number;
	near: number;
	sceneObject: PerspectiveCamera;
	constructor({ buffer, ...data }: CameraProxyConstructorData);
	updateProjectionMatrix(): void;
	updateMatrixWorld(force?: boolean): void;
	tick(): void;
}
export type SceneObjectType = "Object3D" | "PerspectiveCamera";
export declare class SceneComponent extends ActorComponent {
	readonly position: Vector3;
	readonly scale: Vector3;
	readonly rotation: Euler;
	readonly quaternion: Quaternion;
	readonly matrix: Matrix4;
	readonly matrixWorld: Matrix4;
	visible: boolean;
	private readonly children;
	readonly objectType: SceneObjectType;
	constructor();
	init(): void;
	attachToParent(parent: SceneComponent): void;
	toJSON(): SceneProxyConstructorData;
}
export declare class CameraComponent extends SceneComponent {
	#private;
	get fov(): number;
	set fov(val: number);
	get aspect(): number;
	set aspect(val: number);
	get far(): number;
	set far(val: number);
	get near(): number;
	set near(val: number);
	readonly objectType: SceneObjectType;
	constructor();
	toJSON(): CameraProxyConstructorData;
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
export declare class Pawn extends Actor {
}
export declare class PlayerController extends Actor {
	protected pawn?: Pawn;
	protected camera?: CameraComponent;
	getPawn(): Pawn | undefined;
	setPawn(pawn: Pawn): void;
}

export {};
