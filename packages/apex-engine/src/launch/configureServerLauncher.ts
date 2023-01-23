import { HttpServer } from '../network';

export function configureServerLauncher(main: Function) {
  const server = new HttpServer();

  return (middlewares: any) => {
    server.use(middlewares);
    server.listen(8080);
    main();
  };
}
