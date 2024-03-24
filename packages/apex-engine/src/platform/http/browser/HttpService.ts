import { AbstractHttpService, type HttpRequestOptions, type IHttpService } from '../common/Http';

export class BrowserHttpService extends AbstractHttpService implements IHttpService {
  public override async request(url: string, options?: HttpRequestOptions): Promise<Response> {
    return fetch(url);
  }

  public override createHeaders(init?: HeadersInit): Headers {
    return new Headers(init);
  }
}
