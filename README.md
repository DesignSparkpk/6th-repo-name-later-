# AI Shortcut Lab — Shorts-only YouTube channel

A faceless YouTube Shorts channel about **AI tools and AI skills**. Every Short is a finished, animated video rendered from code, so you only have to upload it.

## Folders
| Folder | What's in it |
|---|---|
| `output/` | **Finished Shorts (MP4, 1080×1920). Upload these.** |
| `channel/posting-guide.md` | How to upload, with the title and hashtags for every Short |
| `channel/90-day-plan.md` | Posting schedule, targets and what to check every week |
| `channel/branding.md` | Channel name, About text, logo and banner prompts |
| `scripts/shorts/` | The text of each Short |
| `render/` | The engine that builds the videos (Claude uses this to make new batches) |
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
Ask Claude: *"Make the next batch of 14 Shorts"* and share your best and worst performers from YouTube Studio. Claude writes them into `render/shorts-data.js` and runs `node render/render-all.js`, and the MP4s appear in `output/`.

## Rules that keep the channel monetizable
- Every Short teaches one real, specific, usable thing. No filler or recycled facts.
- Don't re-upload the same video, or near-copies of it.
- Vary the formats: chat demos, before/after comparisons, lists and typed prompts. The template already mixes these.
