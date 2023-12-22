import { cac } from 'cac';

import pkg from '../../package.json' assert { type: 'json' };
import { getApexConfig } from './config';
import { serveBrowserTarget } from './serve';
import { filterDuplicateOptions } from './utils'; ;

interface CLIOptions {
  config?: string;
  debug?: boolean;
  platform?: 'browser' | 'electron' | 'node';
  target?: 'client' | 'game' | 'server';
}

const cli = cac('apex-build-tool').version(pkg.version).help();

cli
  .option('-d, --debug', 'Shows debug messages when enabled.')
  .option('-c, --config', '[string] An optional path to the apex-config file.')
  .option('-t, --target <target>', 'client | game | server')
  .option('-p, --platform <platform>', 'browser | electron | node');

cli
  .command('serve')
  .alias('dev')
  .action(async (options: CLIOptions) => {
    filterDuplicateOptions(options);

    const { config: configFile, debug, platform, target } = options;

    try {
      const { targets } = await getApexConfig(configFile);

      for (const targetConfig of targets) {
        if (platform && targetConfig.platform !== platform) {
          continue;
        }
        if (targetConfig.platform === 'browser') {
          await serveBrowserTarget(targetConfig);
        }
      }

      process.exit();
    } catch (error) {
      console.log(error);
    }
  });

cli.parse();
