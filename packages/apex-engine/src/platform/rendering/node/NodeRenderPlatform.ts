import { IRenderingPlatform } from '../common';

/**
 * This is just a temporary renderer-class for the "node" platform, to avoid Typescript
 * errors of the InstantiationService's "createInstance" method.
 *
 * A "node" build does not render anything, so it will be deleted once I fixed the types.
 */
export class NodeRenderPlatform implements IRenderingPlatform {
  declare readonly _injectibleService: undefined;

  public async init() {}

  public send() {}
}
