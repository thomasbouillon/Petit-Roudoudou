import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { useMemo } from 'react';
import app from '../firebase';

if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(
    getFunctions(app, 'europe-west9'),
    'localhost',
    5001
  );
}

export default function useFunctions() {
  return useMemo(() => getFunctions(app, 'europe-west9'), []);
}
