import { cac } from 'cac';
import { resolveConfig } from 'vite';
import { loadConfigFromFile } from './config';

interface CLIOptions {
  config?: string;
  platform?: 'browser' | 'electron' | 'node';
  target?: 'client' | 'game' | 'server';
}

const cli = cac('apex-build-tool').version('0.1.0').help();

cli
  .option('-c, --config', '[string] An optional path to the apex-config file.')
  .option('-t, --target <target>', 'client | game | server', { default: 'game' })
  .option('-p, --platform <platform>', 'browser | electron | node', { default: 'electron' });

cli
  .command('serve')
  .alias('dev')
  .action(async (options: CLIOptions) => {
    filterDuplicateOptions(options);

    const { config: configFile, platform, target } = options;
    await loadConfigFromFile(configFile);
    //await resolveConfig({ configFile });
    /*if (platform === 'browser') {
      if (target === 'server') {
        throw new Error(`Invalid target: The browser cannot host a server.`);
      }

      const server = await createServer({ configFile, target });

      try {
      } catch (error) {
        console.error(error);
      }
    }*/
  });

cli.parse();

function filterDuplicateOptions<T extends object>(options: T) {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1];
    }
  }
}
