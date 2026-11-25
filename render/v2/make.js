// Build version 2 Shorts: voice (Kokoro) + animation -> MP4.
// Setup once:  python3 -m venv kvenv && kvenv/bin/pip install kokoro-onnx soundfile
//              download kokoro-v1.0.onnx and voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases) into a folder
// Usage:       KOKORO_PY=kvenv/bin/python KOKORO_MODEL=kmodel node render/v2/make.js [V01 V02 ...] [--stills]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

global.window = {};
require('./scripts.js');
const args = process.argv.slice(2);
const stills = args.includes('--stills');
const ids = args.filter(a => !a.startsWith('--'));
const list = ids.length ? ids : Object.keys(window.V2);
const FPS = 30, HANDLE = '@AIShortcutLab';
const work = path.join(__dirname, '..', '..', 'output', 'v2', '_work');
fs.mkdirSync(work, { recursive: true });

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);

(async () => {
  const browser = await chromium.launch();
  for (const id of list) {
    const spec = { ...window.V2[id], voice: window.VOICE };
    const specFile = path.join(work, `${id}.json`);
    fs.writeFileSync(specFile, JSON.stringify(spec));
    execFileSync(process.env.KOKORO_PY || 'python3', ['-I', path.join(__dirname, 'voice.py'), specFile, work, process.env.KOKORO_MODEL || 'kmodel'], { stdio: 'inherit' });
    const timing = JSON.parse(fs.readFileSync(path.join(work, `${id}.timing.json`)));

    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(__dirname, 'short.html'));
    await page.evaluate(([s, tm, h]) => { window.SPEC = s; window.TIMING = tm; window.HANDLE = h; window.init(); }, [spec, timing, HANDLE]);
    await page.evaluate(() => document.fonts.ready);
    if (errors.length) throw new Error(errors.join('\n'));

    if (stills) {
      for (const [i, b] of timing.beats.entries()) {
        await page.evaluate(t => window.render(t), b.start + b.dur * 0.85);
        await page.screenshot({ path: path.join(work, `${id}_still${i}.png`) });
      }
      console.log(`${id}: stills written`); await page.close(); continue;
    }

    const out = path.join(work, '..', `${id}-${slug(spec.title)}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-i', path.join(work, `${id}.wav`), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
      '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const frames = Math.ceil(timing.total * FPS);
    for (let i = 0; i < frames; i++) {
      await page.evaluate(t => window.render(t), i / FPS);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
    console.log(`${id}: ${out} (${timing.total}s)`);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
