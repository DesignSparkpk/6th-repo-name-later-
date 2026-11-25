// Renders every Short in shorts-data.js (or the ids given) to output/<id>-<slug>.mp4
// Usage: node render/render-all.js            -> all
//        node render/render-all.js S02 S05    -> only those
const { execFileSync } = require('child_process');
const path = require('path');
global.window = {};
require('./shorts-data.js');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(window.SHORTS);
for (const id of ids) {
  const slug = window.SHORTS[id].title.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  const out = path.join('output', `${id}-${slug}.mp4`);
  console.log(`== ${id} -> ${out}`);
  execFileSync('node', [path.join(__dirname, 'render.js'), path.join(__dirname, `short.html#${id}`), out], { stdio: 'inherit' });
}
