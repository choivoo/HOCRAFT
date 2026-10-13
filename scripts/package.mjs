// Builds the single-file game and copies it to release/kairoa.html.
import { execSync } from 'node:child_process';
import { mkdirSync, copyFileSync, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
execSync('npx vite build', { stdio: 'inherit' });
if (!existsSync('dist/index.html')) { console.error('dist/index.html missing after build'); process.exit(1); }
mkdirSync('release', { recursive: true });
const dest = resolve('release/kairoa.html');
copyFileSync('dist/index.html', dest);
const n = statSync(dest).size;
console.log(`${dest}\n${n} bytes (${(n / 1024).toFixed(1)} KiB)`);
