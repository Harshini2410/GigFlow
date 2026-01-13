import { copyFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const source = join(__dirname, 'public', '_redirects');
const dest = join(__dirname, 'dist', '_redirects');

try {
  copyFileSync(source, dest);
  console.log('✓ _redirects file copied to dist/');
} catch (error) {
  console.error('Error copying _redirects file:', error.message);
  process.exit(1);
}

