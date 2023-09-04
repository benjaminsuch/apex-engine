import '../bootstrap';
import '../bootstrap-node';

import { CliMain } from './CliMain';

/**
 * Receives and processes CLI arguments that target the engine.
 *
 * @param args CLI arguments for the engine (not to be confused with arguments of our build-scripts).
 */
export async function main(args: string[]) {
  const cli = new CliMain(args);
  cli.init();
}

main(process.argv);

process.stdin.resume();
