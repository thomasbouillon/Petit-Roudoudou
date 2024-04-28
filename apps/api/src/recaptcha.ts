import env from './env';

export async function validateRecaptcha(token: string) {
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${env.RECAPTCHA_SECRET}&response=${token}`,
      {
        method: 'POST',
      }
    );
    const data = await response.json();
    return data.success as boolean;
  } catch (error) {
    return false;
  }
}
