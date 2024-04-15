import { getAuth } from './firebase';
import csvtojson from 'csvtojson';

/**
 * Create users from csv file and seed them into the database.
 * @param pathToCsv Path to the csv file containing the users.
 */
export async function seedUsers(pathToCsv: string) {
  const users = await getUsers(pathToCsv);

  console.log('Users', users);

  const auth = getAuth();
  console.log('Importing', users.length, 'users');
  const res = await auth.importUsers(users, {
    hash: {
      algorithm: 'BCRYPT',
    },
  });
  console.log('Imported', res.successCount, 'users');
  console.log('Errors', res.failureCount, 'users');
  console.log('Errors', res.errors);
}

async function getUsers(pathToCsv: string) {
  const allLegacyUsers = await csvtojson({
    delimiter: ';',
    noheader: false,
  }).fromFile(pathToCsv);
  return allLegacyUsers.map(legacyToNow).filter((user) => !!user);
}

function legacyToNow(user) {
  if (!user.password.startsWith('$2')) return null;
  return {
    uid: 'legacy-' + user.id,
    email: user.email,
    emailVerified: true,
    passwordHash: Buffer.from(user.password),
    displayName: user.firstname + ' ' + user.lastname,
  };
}
