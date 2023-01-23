import { log } from '../core/logging';
import { HttpServer } from '../network';

export function configureServerLauncher(main: Function) {
  log('LauncherConfiguration', 'log', 'Configuring server launcher');

  const server = new HttpServer();

  return (middlewares: any) => {
    server.use(middlewares);
    server.listen(8080, () => {
      log('HttpServer', 'log', 'Server listening on port 8080');
      main();
    });
  };
}
