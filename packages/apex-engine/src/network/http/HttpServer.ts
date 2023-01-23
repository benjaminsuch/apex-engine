import { App as HttpServerBase } from '@tinyhttp/app';
import { log } from '../../core/logging';

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

    this.all('*', (req, res, next) => {
      log('IncomingHttpRequest', 'log', `${req.method} ${req.originalUrl}`);
      next();
    });

    HttpServer.instance = this;
  }
}
