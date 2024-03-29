import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { existsSync } from 'fs-extra';
import { blobFrom, Headers, type HeadersInit, Response as NodeResponse } from 'node-fetch';

import { AbstractHttpService, type HttpRequestOptions, type IHttpService } from '../common/Http';

export class NodeHttpService extends AbstractHttpService implements IHttpService {
  public override async request(url: string, options?: HttpRequestOptions): Promise<Response> {
    try {
      const res = await fetch(url);
      return res;
    } catch (error) {
      const parsedUrl = new URL(pathToFileURL(resolve(url)));

      if (parsedUrl.protocol === 'file:') {
        // If the URL starts with 'file://', read the file from the local file system
        const filePath = fileURLToPath(decodeURIComponent(parsedUrl.href));

        if (!existsSync(filePath)) {
          // @ts-ignore
          return new NodeResponse(null, { status: 404, statusText: 'NOT FOUND', url }) as unknown as Response;
        }

        const blob = await blobFrom(filePath, 'application/octet-stream');
        return new NodeResponse(blob, { status: 200, statusText: 'OK' }) as unknown as Response;
      } else {
        // For all other requests, use node-fetch as usual
        return fetch(url);
      }
    }
  }

  public override createHeaders(init?: HeadersInit): Headers {
    return new Headers(init);
  }
}
