import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const keysDir = path.join(process.cwd(), 'keys');

if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

console.log('✅ RSA keys generated successfully!');
console.log('📁 Location:', keysDir);
console.log('🔑 private.pem - Keep this SECRET');
console.log('🔓 public.pem - Include in app distribution');
