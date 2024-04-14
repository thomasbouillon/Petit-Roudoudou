import { isAuth } from './isAuth';

export const isAdmin = () => isAuth({ role: 'ADMIN' });
