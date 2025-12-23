import { jwtVerify } from 'jose';

export async function verifyJWT(token: string, secret: string) {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
