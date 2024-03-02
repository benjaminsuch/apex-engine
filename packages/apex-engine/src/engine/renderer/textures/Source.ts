import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, proxy } from '../../core/class/specifiers/proxy';
import { serialize } from '../../core/class/specifiers/serialize';
import { RenderProxy } from '../RenderProxy';

export class SourceProxy extends RenderProxy {
  declare data: ImageBitmap | OffscreenCanvas;
}

export class Source extends THREE.Source {
  declare data: ImageBitmap | OffscreenCanvas | null;

  constructor(data: Source['data']) {
    super(data);
  }
}
