import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { seedReviews } from './seedReviews';

yargs(hideBin(process.argv))
  .command(
    'seed [collection]',
    'Seed data',
    (yargs) =>
      yargs
        .positional('collection', {
          describe: 'The collection to seed',
          type: 'string',
        })
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
      if (!argv.collection) {
        console.log('Collection is required');
        return;
      }
      if (!argv.pathToCsv) {
        console.log('Path to csv is required');
        return;
      }
      if (!argv.id) {
        console.log('Article id mapping is required');
        return;
      }

      console.log('Seeding collection:', argv.collection);
      console.log('Path to csv:', argv.pathToCsv);
      console.log('Article id mapping:', argv.id);

      if (argv.collection === 'reviews') {
        await seedReviews(argv.pathToCsv, ...(argv.id as unknown as string[]));
      }
    }
  )
  .strictCommands()
  .strictOptions()
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .showHelpOnFail(true)
  .demandCommand(1, 'You need at least one command before moving on')
  .parseAsync();
