import { type Headers as NodeHeaders, type HeadersInit as NodeHeadersInit } from 'node-fetch';

import { type IInjectibleService, InstantiationService } from '../../di/common/InstantiationService';
import { IConsoleLogger } from '../../logging/common/ConsoleLogger';

export interface HttpRequestOptions {
  credentials?: RequestCredentials;
  headers?: Headers | NodeHeaders;
  method?: string;
  signal?: AbortSignal;
}

export interface IHttpService extends IInjectibleService {
  createHeaders(init?: HeadersInit | NodeHeadersInit): Headers | NodeHeaders;
  request(url: string, options?: HttpRequestOptions): Promise<Response>;
}

export const IHttpService = InstantiationService.createDecorator<IHttpService>('HttpService');

export abstract class AbstractHttpService implements IHttpService {
  declare readonly _injectibleService: undefined;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {}

  abstract request(url: string, options?: HttpRequestOptions): Promise<Response>;

  abstract createHeaders(init?: HeadersInit | NodeHeadersInit): Headers | NodeHeaders;
}
