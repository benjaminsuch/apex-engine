import 'reflect-metadata';

import { InstantiationService } from '../../di/common';
import { TripleBuffer } from '../../memory/common';

export type TRenderMessageType =
  | 'init'
  | 'proxy'
  | 'ref'
  | 'rpc'
  | 'set-camera'
  | 'viewport-resize';

export type TRenderMessageData<T = { [k: string]: unknown }> = {
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
  flags: Uint8Array[];
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

export type TRenderSceneProxyCreateData = TRenderMessageData<{
  constructor: string;
  id: number;
  tb: Pick<TripleBuffer, 'buffers' | 'byteLength' | 'byteViews' | 'flags'>;
  messagePort?: MessagePort;
  tick: number;
}>;

export type TRenderSceneProxyMessage = TRenderMessage<'proxy', TRenderSceneProxyCreateData>;

export type TRenderRPCData = TRenderMessageData<{
  name: string;
  params: unknown[];
  tick: number;
}>;

export type TRenderRPCMessage = TRenderMessage<'rpc', TRenderRPCData>;

export type TRenderRefMessage = TRenderMessage<'ref', { refId: number; parentId: number }>;

export interface IRenderPlatform {
  readonly _injectibleService: undefined;
  getRenderingInfo(): any;
  init(flags: Uint8Array[]): void;
  send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList?: Transferable[]
  ): void;
}

export const IRenderPlatform = InstantiationService.createDecorator<IRenderPlatform>('renderer');
