import CryptoJS from 'crypto-js';

/** Encrypt customer-supplied plaintext using a customer-supplied key. */
export async function encipherPassword(): Promise<string> {
  const key = process.env.TESTTALON_ENCRYPTION_KEY;
  const password = process.env.TESTTALON_PLAIN_PASSWORD;
  if (!key || password === undefined) throw new Error('TESTTALON_ENCRYPTION_KEY and TESTTALON_PLAIN_PASSWORD are required');
  return CryptoJS.AES.encrypt(password, key).toString();
}

/** Decrypt the ciphertext in the PASSWORD variable without logging the plaintext. */
export async function decipherPassword(): Promise<string> {
  const key = process.env.TESTTALON_ENCRYPTION_KEY;
  const ciphertext = process.env.PASSWORD;
  if (!key) throw new Error('TESTTALON_ENCRYPTION_KEY is required');
  if (!ciphertext) throw new Error('PASSWORD is required');
  return CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
}
