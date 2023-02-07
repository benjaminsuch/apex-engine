import { cac } from 'cac';

const cli = cac('apex-build-tool').version('0.1.0').help();

cli
  .command('[root]')
  .alias('dev')
  .alias('serve')
  .action(async () => {
    console.log('Hallo Welt');
  });

cli.parse();
