import { BoxComponent } from '../engine/components/BoxComponent';
import { MeshProxy } from './MeshProxy';
import { SceneProxy } from './SceneProxy';

export const originProxyMap = new Map<string, typeof SceneProxy>();

originProxyMap.set('BoxComponent', MeshProxy);

export const originClassMap = new Map<string, TClass>();

originClassMap.set('BoxComponent', BoxComponent);
