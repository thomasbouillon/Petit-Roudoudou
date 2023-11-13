'use client';

import { Auth, createUserWithEmailAndPassword } from 'firebase/auth';

export const signUpWithEmail = (auth: Auth, email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password).then(
    (userCredential) => userCredential.user
  );
