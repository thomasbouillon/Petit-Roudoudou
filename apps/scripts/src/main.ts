import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { seedReviews } from './seedReviews';
import { seedUsers } from './seedUsers';

yargs(hideBin(process.argv))
  .command(
    'seed-reviews',
    'Seed data',
    (yargs) =>
      yargs
        .option('pathToCsv', {
          alias: 'p',
          describe: 'Path to the csv file containing the reviews',
          type: 'string',
        })
        .option('id', {
          alias: 'm',
          describe: 'First element is the id of the first article in the csv, and so on',
          type: 'array',
        })
        .array('id')
        .demandOption(['pathToCsv', 'id']),
    async (argv) => {
      // Validation
      if (!argv.pathToCsv) {
        console.log('Path to csv is required');
        return;
      }
      if (!argv.id) {
        console.log('Article id mapping is required');
        return;
      }

      console.log('Path to csv:', argv.pathToCsv);
      console.log('Article id mapping:', argv.id);

      await seedReviews(argv.pathToCsv, ...(argv.id as unknown as string[]));
    }
  )
  .command(
    'seed-users',
    'Seed users',
    (yargs) =>
      yargs.option('pathToCsv', {
        alias: 'p',
        describe: 'Path to the csv file containing the users',
        type: 'string',
      }),
    async (argv) => {
      // Validation
      if (!argv.pathToCsv) {
        console.log('Path to csv is required');
        return;
      }

      console.log('Path to csv:', argv.pathToCsv);

      await seedUsers(argv.pathToCsv);
    }
  )
  .strictCommands()
  .demandCommand(1, 'You need at least one command before moving on')
  .strictOptions()
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .showHelpOnFail(true)
  .demandCommand(1, 'You need at least one command before moving on')
  .parseAsync();
