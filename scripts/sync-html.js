// Copies the browser version of the app into the desktop bundle so there is
// only one HTML file to maintain: edit "GACC Worship.html", then build.
const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '..', '..', 'GACC Worship.html');
const targetDir = path.resolve(__dirname, '..', 'app');
const target = path.join(targetDir, 'index.html');

if (!fs.existsSync(source)) {
  console.error(`Could not find ${source}`);
  process.exit(1);
}
fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Copied "${path.basename(source)}" -> app/index.html`);
