import { cac } from 'cac';
import * as path from 'node:path';

const cli = cac('apex-build-tool').version('0.1.0').help();

cli
  .command('build [root]')
  .option('--target <platform>', 'The targeted platform of your build.', {
    default: 'browser'
  })
  .action(async (root: string = process.cwd(), { target }: { target: 'browser' }) => {
    if (target !== 'browser') {
      return;
    }

    const gameFilePath = path.resolve(root, './src/game/index.ts');

    try {
      const module = await import(`file://${gameFilePath}`);
      console.log(module.default);
    } catch (error) {
      console.log(error);
    }
  });

cli.parse();
