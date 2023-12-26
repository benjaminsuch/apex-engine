declare global {
  var DEFAULT_LEVEL: string;
  var IS_BROWSER: string;
  var IS_CLIENT: boolean;
  var IS_DEV: string;
  var IS_GAME: boolean;
  var IS_SERVER: boolean;

  type TClass<T = any> = { new (...args: any[]): T };

  type TypedArray =
    | typeof Float32Array
    | typeof Int8Array
    | typeof Int16Array
    | typeof Int32Array
    | typeof Uint8Array
    | typeof Uint16Array
    | typeof Uint32Array;

  type MaybePromise<T> = Promise<T> | T;

  type TypeOfClassMethod<T, M extends keyof T> = T[M] extends Function ? T[M] : never;

  type IntervalReturn = number | NodeJS.Timer | undefined;
}

export {};
