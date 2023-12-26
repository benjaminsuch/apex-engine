import { type Server } from 'http';

export function closeServerOnTermination(server: Server): void {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];

  signals.forEach((signal) => {
    process.on(signal, () => {
      if (server) {
        server.close();
        process.exit();
      }
    });
  });
}
