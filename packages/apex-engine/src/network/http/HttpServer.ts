import { App as HttpServerBase } from '@tinyhttp/app';

export class HttpServer extends HttpServerBase {
  private static instance?: HttpServer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(
        `No instance of HttpServer found. Please create one first with new HttpServer().`
      );
    }
    return this.instance;
  }

  constructor(options?: ConstructorParameters<typeof HttpServerBase>[0]) {
    super(options);

    HttpServer.instance = this;
  }
}
