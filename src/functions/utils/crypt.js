const crypto = require('crypto');
require('dotenv').config();

const KEY_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 8;

function base64urlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function deriveKey(password) {
  const salt = 'fixed_salt_change_me';
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}
function encrypt(str, password) {
  const key = deriveKey(password);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-128-gcm', key, iv, { authTagLength: TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return base64urlEncode(Buffer.concat([iv, tag, ciphertext]));
}

function decrypt(payloadB64url, password) {
  const key = deriveKey(password);
  const data = base64urlDecode(payloadB64url);

  if (data.length < IV_LENGTH + TAG_LENGTH) throw new Error('Payload trop court');

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-128-gcm', key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };