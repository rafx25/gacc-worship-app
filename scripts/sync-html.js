// Copies the browser version of the app into the desktop bundle so there is
// only one HTML file to maintain: edit "GACC Worship.html", then build.
const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '..', '..', 'GACC Worship.html');
const targetDir = path.resolve(__dirname, '..', 'app');
const target = path.join(targetDir, 'index.html');

if (!fs.existsSync(source)) {
  // CI / fresh clone: the source lives outside the repo, so use the committed copy.
  if (fs.existsSync(target)) {
    console.log(`"${path.basename(source)}" not found, using committed app/index.html`);
    process.exit(0);
  }
  console.error(`Could not find ${source}`);
  process.exit(1);
}
fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Copied "${path.basename(source)}" -> app/index.html`);
