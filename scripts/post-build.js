import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
try {
  let content = readFileSync(indexPath, 'utf-8');
  const buildTime = new Date().toISOString();
  content = content.replace('%BUILD_TIME%', buildTime);
  writeFileSync(indexPath, content);
  console.log(`Build time stamp added to HTML: ${buildTime}`);
} catch (e) {
  console.error('Failed to update index.html with build time');
}
