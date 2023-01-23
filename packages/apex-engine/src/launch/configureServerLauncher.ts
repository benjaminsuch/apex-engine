import { log } from '../core/logging';
import { HttpServer } from '../network/http';
import { WebsocketServer } from '../network/websockets';

const port = 8080;

export function configureServerLauncher(main: Function) {
  log('LauncherConfiguration', 'log', 'Configuring server launcher');

  const io = new WebsocketServer(port, {
    cors: {
      origin: '*'
    }
  });

  return (callback: (server: WebsocketServer | HttpServer) => void) => {
    callback(io);
    main();
  };
}
