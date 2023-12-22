export function closeServerOnTermination(server: any) {
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
