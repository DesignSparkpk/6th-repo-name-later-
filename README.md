# AI Shortcut Lab — Shorts-only YouTube channel

A faceless YouTube Shorts channel about **AI tools and AI skills**. Every Short is a finished, animated video rendered from code, so you only have to upload it.

## Folders
| Folder | What's in it |
|---|---|
| `output/v4/` | **3D "How it works" explainers (Three.js), e.g. the fireworks Short.** |
| `output/v3/` | **Finished Shorts: voice, original beat, sound effects, transitions (MP4, 1080×1920). Upload these.** |
| `output/voice-samples/` | 6 voice options. Tell Claude which one you like best. |
| `research/what-works-ai-shorts.md` | Analysis of winning and losing AI Shorts, and the rules the Shorts follow |
| `output/archive-v1/`, `output/archive-v2/` | Older versions. Don't post them. |
| `channel/posting-guide.md` | How to upload, with the title and hashtags for every Short |
| `channel/90-day-plan.md` | Posting schedule, targets and what to check every week |
| `channel/branding.md` | Channel name, About text, logo and banner prompts |
| `scripts/shorts/` | The text of each Short |
| `render/v4/` | 3D engine: `scripts.js` (story + sound cues), `short3d.html` (3D scenes, Volt the mascot, overlays), `make.js` (render). Audio comes from `render/v3/audio.py`. |
| `render/v3/` | The engine that builds the videos: `scripts.js` (content), `audio.py` (voice, beat, sound effects), `short.html` (visuals), `make.js` (render and mix) |
| `scripts/long/` | Long-video scripts. Not part of the Shorts plan; kept in case you add long videos later. |

## How monetization works for a Shorts-only channel
| Level | Requirement | What you get |
|---|---|---|
| Lower tier | 500 subscribers, 3 uploads in the last 90 days, **3 million Shorts views in 90 days** | Memberships, Super Thanks, YouTube Shopping affiliate |
| Full Partner Program | 1,000 subscribers and **10 million Shorts views in 90 days** | Share of Shorts ad revenue |

**Be realistic about the money:** Shorts ad revenue is low, usually a few cents up to about $0.10 per 1,000 views. 10 million views typically pays in the hundreds of dollars, not thousands. The real income for this kind of channel comes from:
1. **Affiliate links** to AI tools (link page in the channel header and pinned comments), which you can use from day 1.
2. **Your own digital product**, such as a prompt pack or Notion template, sold through the link page once you have an audience.
3. **Sponsors**: AI tool companies pay creators in this niche even at 10,000–50,000 subscribers.

## Making new Shorts
Ask Claude: *"Make the next batch of 14 Shorts"* and share your best and worst performers from YouTube Studio. Claude writes them into `render/v3/scripts.js` and runs `render/v3/make.js`, and the MP4s appear in `output/v3/`. The voice is Kokoro, an open-source model licensed under Apache 2.0, so commercial use is allowed.

## Rules that keep the channel monetizable
- Every Short teaches one real, specific, usable thing. No filler or recycled facts.
- Don't re-upload the same video, or near-copies of it.
- Vary the formats: chat demos, before/after comparisons, lists and typed prompts. The template already mixes these.

## Tools and setup
Everything runs in the cloud session, so you don't install anything. The environment **6th-repo-name-later-** has a setup script that installs:
- **Kokoro** voice (to `/opt/kokoro`), the open-source text-to-speech model, licensed for commercial use
- **Three.js** for 3D (`npm install`)

Chromium, Playwright and ffmpeg are already part of the cloud image. Pick the **6th-repo-name-later-** environment when you start a new session.
