// Build version 4 (3D) Shorts: Kokoro voice + synthesized beat + SFX + animation -> MP4.
// Setup once:  the environment's setup script installs Kokoro to /opt/kokoro (or set KOKORO_PY / KOKORO_MODEL), then: npm install
//              download kokoro-v1.0.onnx and voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases) into a folder
// Usage:       KOKORO_PY=kvenv/bin/python KOKORO_MODEL=kmodel node render/v4/make.js [V01 ...] [--stills]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

global.window = {};
require('./scripts.js');
const http = require('http');
const args = process.argv.slice(2);
const stills = args.includes('--stills');
const ids = args.filter(a => !a.startsWith('--'));
const list = ids.length ? ids : Object.keys(window.V4);
const FPS = 30, HANDLE = '@AIShortcutLab';
const work = path.join(__dirname, '..', '..', 'output', 'v4', '_work');
fs.mkdirSync(work, { recursive: true });
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);

// voice: clean up + presence + compression; music: ducked under the voice; then loudness to -14 LUFS
const MIX = [
  '[1:a]aresample=44100,highpass=f=90,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3800:t=q:w=1.2:g=4,acompressor=threshold=-20dB:ratio=4:attack=4:release=90:makeup=6dB,aformat=channel_layouts=stereo,asplit=2[v][vsc]',
  '[2:a]aformat=channel_layouts=stereo,volume=0.6[mus]',
  '[mus][vsc]sidechaincompress=threshold=0.04:ratio=5:attack=8:release=250[mduck]',
  '[3:a]aformat=channel_layouts=stereo,volume=0.62[fx]',
  '[v][mduck][fx]amix=inputs=3:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]',
].join(';');

(async () => {
  // serve the repo over http so the page can load Three.js as ES modules
  const root = path.join(__dirname, '..', '..');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(0, '127.0.0.1');
  await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const id of list) {
    const spec = { ...window.V4[id], voice: window.VOICE };
    const specFile = path.join(work, `${id}.json`);
    fs.writeFileSync(specFile, JSON.stringify(spec));
    execFileSync(process.env.KOKORO_PY || (fs.existsSync('/opt/kokoro/venv/bin/python') ? '/opt/kokoro/venv/bin/python' : 'python3'), ['-I', path.join(__dirname, '..', 'v3', 'audio.py'), specFile, work, process.env.KOKORO_MODEL || (fs.existsSync('/opt/kokoro/voices-v1.0.bin') ? '/opt/kokoro' : 'kmodel')], { stdio: 'inherit' });
    const timing = JSON.parse(fs.readFileSync(path.join(work, `${id}.timing.json`)));

    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/render/v4/short3d.html');
    await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
    await page.evaluate(([s, tm, h]) => { window.SPEC = s; window.TIMING = tm; window.HANDLE = h; window.init(); }, [spec, timing, HANDLE]);
    await page.evaluate(() => document.fonts.ready);

    if (stills) {
      const times = [0.25, ...timing.hooks.map(h => h.emojiT + 0.3), ...timing.beats.map(b => b.start + b.dur * 0.8)];
      for (const [i, tt] of times.entries()) {
        await page.evaluate(t => window.render(t), tt);
        await page.screenshot({ path: path.join(work, `${id}_still${i}.png`) });
      }
      if (errors.length) throw new Error(errors.join('\n'));
      console.log(`${id}: stills written`); await page.close(); continue;
    }

    const out = path.join(work, '..', `${id}-${slug(spec.title)}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-i', path.join(work, `${id}.voice.wav`), '-i', path.join(work, `${id}.music.wav`), '-i', path.join(work, `${id}.sfx.wav`),
      '-filter_complex', MIX, '-map', '0:v', '-map', '[aout]',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
      '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const frames = Math.ceil(timing.total * FPS);
    for (let i = 0; i < frames; i++) {
      await page.evaluate(t => window.render(t), i / FPS);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`${id}: ${out} (${timing.total}s)`);
    await page.close();
  }
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
