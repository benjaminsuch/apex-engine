import { cac } from 'cac';

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
  });

cli.parse();
