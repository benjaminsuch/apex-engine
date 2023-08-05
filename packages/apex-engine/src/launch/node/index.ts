import { createServer } from 'node:http';

import '../bootstrap';
import '../bootstrap-node';

import { CliMain } from './CliMain';

/**
 * Receives and processes CLI arguments that target the engine.
 *
 * @param args CLI arguments for the engine (not to be confused with arguments of our build-scripts).
 */
export async function main(args: string[]) {
  const { HOST = '127.0.0.1', PORT = 3010 } = process.env;

  const server = createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
  });

  server.listen(+PORT, HOST, () => {
    console.log(`\nServer running at http://${HOST}:${PORT}/\n`);

    const cli = new CliMain(args);

    cli.init();
  });
}

main(process.argv);
