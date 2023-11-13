'use client';

import { Auth, signInWithEmailAndPassword } from 'firebase/auth';

export const signInWithEmail = (auth: Auth, email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password).then(
    (userCredential) => userCredential.user
  );
