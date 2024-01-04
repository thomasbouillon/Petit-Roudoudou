import { beforeUserCreated } from 'firebase-functions/v2/identity';

export const onUserRegistered = beforeUserCreated((event) => {
  const user = event.data;
  console.log(`User registered: ${user.uid}`);
});
