import { log } from '../core/logging';
import { HttpServer } from '../network/http';
import { WebsocketServer } from '../network/websockets';

const port = 8080;

export function configureServerLauncher(main: Function) {
  log('LauncherConfiguration', 'log', 'Configuring server launcher');

  //const server = new HttpServer();
  const io = new WebsocketServer(8081, {
    cors: {
      origin: '*'
    }
  });

  return (middlewares: any) => {
    main();
    /*server.use(middlewares);
    server.listen(port, () => {
      log('HttpServer', 'log', `Server listening on port ${port}`);
      main();
    });*/
  };
}
