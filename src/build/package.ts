import { execSync } from 'node:child_process';
import * as fs from 'node:fs';

const name = process.argv[2];
if (!name) {
  console.error('No name provided');
  process.exit(1);
}
fs.renameSync('dist/index.html', `public/${name}.html`);
execSync(`git add public/${name}.html`);
