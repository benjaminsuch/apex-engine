import { cac } from 'cac';

import pkg from '../../package.json' assert { type: 'json' };
import { buildBrowserTarget } from './build';
import { getApexConfig } from './config';
import { serveBrowserTarget, serveElectronTarget } from './serve';
import { filterDuplicateOptions, measure } from './utils';

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

    const { config: configFile, platform } = options;

    try {
      const readApexConfig = measure();
      const { targets } = await getApexConfig(configFile);
      readApexConfig.done('Bundle apex config (%ss)');

      for (const targetConfig of targets) {
        if (platform && targetConfig.platform !== platform) {
          continue;
        }

        if (targetConfig.platform === 'browser') {
          await serveBrowserTarget(targetConfig);
        }
        if (targetConfig.platform === 'electron') {
          await serveElectronTarget(targetConfig);
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

cli.command('build').action(async (options: CLIOptions) => {
  const buildCmd = measure();

  filterDuplicateOptions(options);

  const { config: configFile, platform } = options;

  try {
    const readApexConfig = measure();
    const { targets } = await getApexConfig(configFile);
    readApexConfig.done('Bundle apex config (%ss)');

    for (const targetConfig of targets) {
      if (platform && targetConfig.platform !== platform) {
        continue;
      }

      const buildTarget = measure();

      if (targetConfig.platform === 'browser') {
        await buildBrowserTarget(targetConfig);
      }

      buildTarget.done(`Build project (%ss)`);
    }
  } catch (error) {
    console.log(error);
  } finally {
    buildCmd.done('All tasks done in %ss');
    process.exit();
  }
});

cli.parse();
