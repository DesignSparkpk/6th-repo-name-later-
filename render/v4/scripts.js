// Version 4: 3D "How it works" explainers (Three.js). Same beat format as v3, plus:
//   scene: which 3D scene plays during the beat (see SCENES in short3d.html)
//   {sfx:[{k, at}]}  timed sounds; at = seconds from beat start, negative = from beat end, or 'word:xyz' = when that word is spoken.
//                    3D scenes read the same cues, so explosions land exactly on the sound.
//   {tags:[{text, anchor, at}]}  labels pinned to 3D objects
//   {tiles:[...]}    element tiles (colours scene)
// Hook rules: frame 1 is already mid-explosion, line 1 talks to the viewer, beat 2 opens a loop that is paid off at the rehook.
// Facts checked: firework colours come from metal salts (strontium red, barium green, sodium yellow, copper blue);
// blue is hardest because copper compounds break down when the star burns too hot; colour comes from excited electrons emitting light.
window.VOICE = { name: 'af_bella', speed: 1.15 };
window.V4 = {};
const S = (id, meta, beats) => (window.V4[id] = { id, ...meta, beats });

S('F01', { title: 'Every firework color is a burning metal (3D explained)', label: 'HOW IT WORKS · FIREWORKS' }, [
  { scene: 'hookSky', say: "You've been watching *metal* burn your whole life... and nobody told you.",
    do: [{ hook: { lines: ["YOU'VE BEEN", 'WATCHING *METAL*', 'BURN'], emoji: '🎆', tone: 'red' } }] },
  { scene: 'tease', say: 'And one color is so hard to make... chemists *still* struggle with it.',
    do: [{ sfx: [{ k: 'burst', at: 'word:color', vol: 0.7 }, { k: 'zap', at: 'word:struggle', vol: 0.6 }] }] },
  { scene: 'launch', say: "Here's what happens inside *one* shell. A lift charge *blasts* it out of a steel tube...",
    do: [{ sfx: [{ k: 'launch', at: 'word:blasts' }] }] },
  { scene: 'rise', say: '...while a slow fuse burns inside, as it climbs into the night.',
    do: [{ sfx: [{ k: 'hiss', at: 0, d: 3.2, vol: 0.8 }] }] },
  { scene: 'cutaway', say: 'Inside are dozens of pellets called *stars*. Each one is fuel, oxygen... and a *metal salt*.',
    do: [{ tags: [{ text: 'FUSE', anchor: 'fuse', at: 'word:inside' }, { text: 'STARS', anchor: 'star', at: 'word:stars' }, { text: 'BURST CHARGE', anchor: 'core', at: 'word:fuel' }, { text: 'METAL SALT', anchor: 'star2', at: 'word:metal' }] }, { sfx: [{ k: 'pop', at: 'word:stars', vol: 0.6 }, { k: 'pop', at: 'word:metal', vol: 0.6 }] }] },
  { scene: 'boom', say: 'When the fuse reaches the center... *boom!*',
    do: [{ sfx: [{ k: 'boom', at: 'word:boom' }] }] },
  { scene: 'colors', say: 'Each metal glows its own color. *Strontium*, red. *Barium*, green. *Sodium*, yellow. *Copper*, blue.',
    do: [{ tiles: [{ sym: 'Sr', name: 'Strontium', color: '#FF2D4B', at: 'word:strontium' }, { sym: 'Ba', name: 'Barium', color: '#2DFF6A', at: 'word:barium' }, { sym: 'Na', name: 'Sodium', color: '#FFC92D', at: 'word:sodium' }, { sym: 'Cu', name: 'Copper', color: '#2D7BFF', at: 'word:copper' }] },
      { sfx: [{ k: 'burst', at: 'word:strontium' }, { k: 'burst', at: 'word:barium' }, { k: 'burst', at: 'word:sodium' }, { k: 'burst', at: 'word:copper' }] }] },
  { scene: 'blueFail', say: 'Remember that impossible color? It\'s *blue*.', do: [{ rehook: true }] },
  { scene: 'blueFail2', say: 'Burn it too hot, and the copper breaks apart... and the blue *washes out* to white.',
    do: [{ sfx: [{ k: 'burst', at: 'word:burn', vol: 0.8 }, { k: 'zap', at: 'word:washes', vol: 0.7 }] }] },
  { scene: 'atom', say: 'Why do metals glow at all? Heat kicks their electrons *up*... and when they fall back, they release light in *one exact color*.',
    do: [{ sfx: [{ k: 'whoosh', at: 'word:up', vol: 0.6 }, { k: 'ding', at: 'word:fall', vol: 0.7 }] }] },
  { scene: 'purple', say: 'Mix strontium and copper... and you get *purple*.',
    do: [{ sfx: [{ k: 'boom', at: 'word:purple' }] }] },
  { scene: 'heart', say: 'Follow for part two... how they make *hearts* in the sky!',
    do: [{ cta: { text: 'FOLLOW', sub: 'Part 2: shapes in the sky ❤️' } }, { sfx: [{ k: 'boom', at: 'word:hearts' }] }] },
]);
