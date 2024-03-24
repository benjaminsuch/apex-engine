// The majority of this code is from: https://github.com/mrdoob/three.js/blob/master/src/loaders/FileLoader.js

import { Cache, Loader, type LoadingManager } from 'three';
import { DefaultLoadingManager } from 'three';

import { type HttpRequestOptions, IHttpService } from '../platform/http/common/Http';
import { HttpError } from '../platform/http/common/HttpError';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';

export type FileLoaderOnLoad = (data: any) => void;

export type FileLoaderOnProgress = (event: ProgressEvent) => void;

export type FileLoaderOnError = (err: unknown) => void;

interface LoadingUrl {
  onLoad: FileLoaderOnLoad;
  onProgress: FileLoaderOnProgress;
  onError: FileLoaderOnError;
}

const loading: Record<string, LoadingUrl[]> = {};

function noop(): void {}

export class FileLoader extends Loader {
  public mimeType: DOMParserSupportedType = 'text/html';

  public responseType: string = '';

  public abortController: AbortController | null = null;

  constructor(
    manager: LoadingManager = DefaultLoadingManager,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IHttpService protected readonly http: IHttpService,
  ) {
    super(manager);
  }

  public override load(url: string, onLoad: FileLoaderOnLoad, onProgress: FileLoaderOnProgress = noop, onError: FileLoaderOnError = noop): void {
    if (this.path) {
      url = this.path + url;
    }

    url = this.manager.resolveURL(url);

    const cached = Cache.get(url);

    if (cached) {
      this.manager.itemStart(url);

      setTimeout(() => {
        onLoad(cached);
        this.manager.itemEnd(url);
      }, 0);

      return cached;
    }

    // Check if request is duplicate
    if (loading[url]) {
      loading[url].push({ onLoad, onProgress, onError });
      return;
    }

    loading[url] = [{ onLoad, onProgress, onError }];

    const options: HttpRequestOptions = {
      headers: this.http.createHeaders(this.requestHeader),
      credentials: this.withCredentials ? 'include' : 'same-origin',
    };

    if (this.abortController) {
      options.signal = this.abortController.signal;
    }

    this.http.request(url, options)
      .then((res) => {
        if (res.status === 200 || res.status === 0) {
          if (res.status === 0) {
            this.logger.warn('FileLoader: HTTP Status 0 received.');
          }

          if (typeof ReadableStream === 'undefined' || res.body === undefined || res.body?.getReader === undefined) {
            return res;
          }

          const callbacks = loading[url];
          const reader = res.body.getReader();

          // Nginx needs X-File-Size check
          // https://serverfault.com/questions/482875/why-does-nginx-remove-content-length-header-for-chunked-content
          const contentLength = res.headers.get('Content-Length') ?? res.headers.get('X-File-Size');
          const total = contentLength ? parseInt(contentLength) : 0;
          const lengthComputable = total !== 0;

          let loaded = 0;

          // periodically read data into the new stream tracking while download progress
          const stream = new ReadableStream({
            start(controller): void {
              readData();

              function readData(): void {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                  } else {
                    loaded += value.byteLength;

                    const event = new ProgressEvent('progress', { lengthComputable, loaded, total });

                    for (let i = 0; i < callbacks.length; i++) {
                      callbacks[i].onProgress?.(event);
                    }

                    controller.enqueue(value);
                    readData();
                  }
                });
              }
            },

          });

          return new Response(stream);
        } else {
          throw new HttpError(`fetch for "${res.url}" responded with ${res.status}: ${res.statusText}`, res);
        }
      })
      .then((res) => {
        switch (this.responseType) {
          case 'arraybuffer':
            return res.arrayBuffer();
          case 'blob':
            return res.blob();
          case 'document':
            return res.text().then(text => new DOMParser().parseFromString(text, this.mimeType));
          case 'json':
            return res.json();
          default:
            const exec = /charset="?([^;"\s]*)"?/i.exec(this.mimeType);
            const label = exec && exec[1] ? exec[1].toLowerCase() : undefined;
            const decoder = new TextDecoder(label);
            return res.arrayBuffer().then(ab => decoder.decode(ab));
        }
      })
      .then((data) => {
        // Add to cache only on HTTP success, so that we do not cache
        // error response bodies as proper responses to requests.
        Cache.add(url, data);

        const callbacks = loading[url];
        delete loading[url];

        for (let i = 0; i < callbacks.length; i++) {
          const callback = callbacks[i];
          if (callback.onLoad) callback.onLoad(data);
        }
      })
      .catch((err) => {
        // Abort errors and other errors are handled the same
        const callbacks = loading[url];

        if (!callbacks) {
          // When onLoad was called and url was deleted in `loading`
          this.manager.itemError(url);
          throw err;
        }

        delete loading[url];

        for (let i = 0, il = callbacks.length; i < il; i++) {
          const callback = callbacks[i];
          if (callback.onError) callback.onError(err);
        }

        this.manager.itemError(url);
      })
      .finally(() => {
        this.manager.itemEnd(url);
      });

    this.manager.itemStart(url);
  }
}
