// Version 3 Shorts: high-stakes hooks, rehooks, music, SFX and transitions.
// `say` is spoken (wrap a word in *stars* to emphasise it in captions). `do` lists what happens on screen.
// Actions:
//   {hook:{lines:[], emoji, tone}}  kinetic slam text (tone: red | lime | blue). *word* = coloured
//   {label:'TEXT'}                  series pill at top
//   {user:'..'} / {ai:'..'}         chat bubbles (AI streams in, with typing sounds)
//   {clear:true}                    wipe chat (whip transition)
//   {list:{title, items}} {hl:n}    save-bait list, highlight item n
//   {split:{bad:{prompt,out}, good:{prompt,out}}}  before/after
//   {mark:'exact text'}             highlighter sweep over that text in the visible chat
//   {stamp:{text, tone}}            rotated stamp slam (tone: red | lime)
//   {react:'emoji'}                 emoji burst
//   {zoom:true}                     camera punch-in on the newest message
//   {rehook:true}                   music drops out + riser, slams back on the next beat
//   {cta:{text, sub}}               end call-to-action with arrow to the comments
// Every AI reply is a real answer to the exact prompt shown.
window.VOICE = { name: 'af_bella', speed: 1.18 };
window.V3 = {};
const S = (id, meta, beats) => (window.V3[id] = { id, ...meta, beats });

S('V01', { title: 'This prompt will hurt (brutally honest AI mentor)' }, [
  { say: "If you've been *planning* something for months... this prompt is going to *hurt*.", do: [{ hook: { lines: ['THIS PROMPT', 'IS GOING', 'TO *HURT*'], emoji: '💀', tone: 'red' } }] },
  { say: 'Tell your AI to be your *brutally honest* mentor. No flattery!', do: [{ label: 'PROMPT #1 · HONEST MENTOR' }, { user: "Be my brutally honest mentor. No flattery. Point out my excuses and blind spots. My situation: I've wanted to start a YouTube channel for a year but haven't posted once." }] },
  { say: "I told it I've been planning a channel for a *whole year*... and it did *not* hold back.", do: [{ ai: "You don't have a planning problem. You have a fear-of-being-judged problem. A year of \"preparing\" is avoidance with a to-do list. Your first video will be bad. Post it anyway, by Friday at 6 pm." }] },
  { say: 'Avoidance... with a *to-do list*. Ouch!', do: [{ mark: 'avoidance with a to-do list' }, { react: '💀' }, { zoom: true }] },
  { say: "But wait. *Don't* stop here. Add this *one* line.", do: [{ rehook: true }, { user: 'Now ask me the one hard question I keep avoiding.' }] },
  { say: 'And it hits you with the question you *actually* need to hear.', do: [{ ai: 'If nobody watched for the next six months, would you still post every week?' }, { zoom: true }] },
  { say: "Comment *MENTOR* if you want part two. Because this prompt is going to *hurt*.", do: [{ cta: { text: 'Comment "MENTOR"', sub: 'for Part 2' } }] },
]);

S('V02', { title: 'Your AI has been lying to you (fix it with one line)' }, [
  { say: 'Your AI has been *lying* to you... this *whole time*.', do: [{ hook: { lines: ['YOUR AI IS', '*LYING*', 'TO YOU'], emoji: '🤥', tone: 'red' } }] },
  { say: "Not to trick you. To make you *happy*. It's trained to be helpful, so it often just *agrees* with you.", do: [{ label: 'MYTH BUST · AI FLATTERY' }, { user: 'My business idea: selling ice to people in Alaska. Brilliant, right?' }] },
  { say: "So here's the fix. Add *this* line.", do: [{ user: "Be honest. No flattery. Disagree with me if I'm wrong." }, { zoom: true }] },
  { say: 'And *now*... it actually pushes back!', do: [{ ai: 'Honestly? Not as stated. Demand is low and anyone there can make ice for free. But one version could work: crystal-clear premium ice for cocktail bars and events. People do pay for that.' }] },
  { say: 'Demand is *low*. Finally, the truth!', do: [{ mark: 'Demand is low' }, { stamp: { text: 'HONEST', tone: 'lime' } }] },
  { say: "But here's what nobody notices. It *also* found the version that *could* work.", do: [{ rehook: true }, { mark: 'premium ice for cocktail bars and events' }, { react: '🤯' }] },
  { say: 'Save this for every feedback prompt. Because by default... your AI is *lying* to you.', do: [{ cta: { text: 'SAVE THIS', sub: 'use it for every feedback prompt' } }] },
]);

S('V03', { title: '25 AI prompts that beat you in exams (save this)' }, [
  { say: 'Students using these *25 prompts* are going to *beat you* in exams.', do: [{ hook: { lines: ['25 PROMPTS', 'THAT *BEAT YOU*', 'IN EXAMS'], emoji: '📚', tone: 'lime' } }] },
  { say: "Don't try to read them all. *Pause*... and save this!", do: [{ label: 'SAVE THIS · STUDENTS' }, { list: { title: '25 AI prompts for students', items: [
    "Explain [topic] like I'm 12, then like a professor",
    'Quiz me on [topic], one question at a time',
    'Turn these notes into 10 flashcards',
    'What are the 5 most likely exam questions on [topic]?',
    'Find the mistakes in my answer: [paste]',
    'Make me a 7-day revision plan for [exam]',
    'Give me a memory trick for [list]',
    'Summarise this chapter in 5 bullet points',
    'What do students usually get wrong about [topic]?',
    'Explain this formula step by step: [formula]',
    'Give me 3 real-life examples of [concept]',
    'Turn this topic into a story so I remember it',
    'Ask me questions until I understand [topic]',
    "I'll explain [topic]. Tell me what I missed",
    'Compare [A] and [B] in a table',
    'Rewrite my essay intro to be clearer, not fancier',
    'Give me an essay outline for: [question]',
    'Which part of my essay is weakest and why?',
    'Make a mind map of [topic] in text',
    'Give me practice problems, easy to hard',
    "Check my solution. Don't give the answer, give a hint",
    'Translate this jargon into plain English',
    'What should I learn first to understand [topic]?',
    'Make a cheat sheet for [topic] on one page',
    'Test me like a strict examiner on [topic]',
  ] } }] },
  { say: 'Number *fourteen* is the one nobody uses. You explain it... and AI finds *exactly* what you missed.', do: [{ hl: 14 }] },
  { say: 'But number *twenty-one* is the real secret. It gives you a *hint*... not the answer.', do: [{ rehook: true }, { hl: 21 }] },
  { say: 'Screenshot it *now*, before you scroll. Because students using these are going to *beat you*.', do: [{ cta: { text: 'SCREENSHOT NOW', sub: 'before you scroll 📸' } }] },
]);

S('V04', { title: "You're wasting hours on Excel (do this instead)" }, [
  { say: "You're wasting *hours* on Excel... every single week.", do: [{ hook: { lines: ["YOU'RE WASTING", '*HOURS*', 'ON EXCEL'], emoji: '⏳', tone: 'red' } }] },
  { say: 'Stop googling formulas. Just *describe* your sheet in plain English.', do: [{ label: 'REAL WORK · EXCEL' }, { user: 'Column A has dates. Column B has sales. Give me one formula for total sales in March 2026.' }] },
  { say: 'Three seconds later...', do: [{ ai: '=SUMIFS(B:B, A:A, ">="&DATE(2026,3,1), A:A, "<"&DATE(2026,4,1))' }, { zoom: true }] },
  { say: 'One formula. *Done!*', do: [{ stamp: { text: 'DONE ✓', tone: 'lime' } }] },
  { say: "But don't just *paste* it. Ask one more thing, so you never google it *again*.", do: [{ rehook: true }, { user: 'Explain each part in one line.' }] },
  { say: 'Now *you* understand it... and you can change it yourself.', do: [{ ai: 'SUMIFS adds column B, but only rows where column A is on or after March 1st, and before April 1st.' }, { mark: 'only rows where column A is on or after March 1st' }] },
  { say: 'Comment *PART 2*, and I\'ll show you how AI builds the *whole dashboard*!', do: [{ cta: { text: 'Comment "PART 2"', sub: 'AI builds the whole dashboard' } }] },
]);

S('V05', { title: 'Recruiters spot this AI cover letter in 1 second' }, [
  { say: 'Recruiters can spot this *AI cover letter*... in *one second*.', do: [{ hook: { lines: ['RECRUITERS', 'SPOT THIS IN', '*1 SECOND*'], emoji: '🚩', tone: 'red' } }] },
  { say: 'This is what most people type... and *this* is what they get.', do: [{ label: 'BEFORE → AFTER · COVER LETTER' }, { split: { bad: { prompt: 'write a cover letter for a marketing job', out: 'Dear Hiring Manager, I am writing to express my strong interest in the Marketing position at your esteemed company...' } } }] },
  { say: '*Esteemed company?* Every recruiter has read that a *thousand* times.', do: [{ mark: 'esteemed company' }, { stamp: { text: 'REJECTED', tone: 'red' } }] },
  { say: 'Now watch what *three* small changes do.', do: [{ rehook: true }, { split: { bad: { prompt: 'write a cover letter for a marketing job', out: 'Dear Hiring Manager, I am writing to express my strong interest in the Marketing position at your esteemed company...' }, good: { prompt: "Job post: [paste]. My best result: grew a café's Instagram from 800 to 6,000 followers in 5 months. Tone: confident, simple, no clichés. Under 200 words.", out: "Five months ago, a small café had 800 Instagram followers. Today it has 6,000, and weekend sales are up. I'd like to do the same for your brand..." } } }] },
  { say: 'A real result. A clear tone. Now it sounds like a *person*... not a template!', do: [{ mark: 'Today it has 6,000' }, { react: '🔥' }] },
  { say: 'Follow for more job hacks. Because recruiters *will* spot the other one... in one second.', do: [{ cta: { text: 'FOLLOW', sub: 'for more job hacks' } }] },
]);

S('V06', { title: "You're using AI like everyone else (that's the problem)" }, [
  { say: "You're using AI *exactly* like everyone else... and that's the *problem*.", do: [{ hook: { lines: ['YOU USE AI', 'LIKE', '*EVERYONE ELSE*'], emoji: '🫠', tone: 'blue' } }] },
  { say: 'Ask it to plan a trip... and you get the *same* plan as everybody.', do: [{ label: 'HIDDEN TRICK · PROMPT #2' }, { user: 'Plan a 3-day trip to Istanbul for me.' }, { ai: 'Day 1: Hagia Sophia, Blue Mosque, Grand Bazaar. Day 2: Bosphorus cruise...' }] },
  { say: 'Generic!', do: [{ stamp: { text: 'GENERIC', tone: 'red' } }] },
  { say: 'Now add *one* line... and watch what happens.', do: [{ rehook: true }, { clear: true }, { user: 'Plan a 3-day trip to Istanbul for me. Before you start, ask me any questions you need to do this well.' }] },
  { say: 'It *interviews* you first! Budget, pace, food... what you *actually* want.', do: [{ ai: "1. What's your budget per day?\n2. Relaxed or packed schedule?\n3. Any food you love or avoid?\n4. History, shopping, nightlife, or views?" }, { zoom: true }] },
  { say: 'Now the plan is built for *you*. Not for everyone.', do: [{ mark: 'Relaxed or packed schedule?' }, { react: '🎯' }] },
  { say: 'Try it today, and comment what it asked *you*!', do: [{ cta: { text: 'TRY IT TODAY', sub: 'comment what it asked you' } }] },
]);

S('V07', { title: 'One bad reply loses a customer forever (AI fix)' }, [
  { say: 'One bad reply... can lose you a customer *forever*.', do: [{ hook: { lines: ['1 BAD REPLY', 'LOSES A CUSTOMER', '*FOREVER*'], emoji: '😡', tone: 'red' } }] },
  { say: "So when an angry message comes in... *don't* reply yet.", do: [{ label: 'REAL WORK · CUSTOMER SERVICE' }, { user: 'Angry customer: "My order is 5 days late. This is the worst service ever. I want a refund NOW."' }, { react: '😡' }] },
  { say: 'Paste it into AI with *this* prompt.', do: [{ user: 'Write a calm, short reply. Apologise once, take responsibility, give a clear next step and a timeline. No corporate language.' }, { zoom: true }] },
  { say: 'Ten seconds later... *this*.', do: [{ ai: "You're right to be frustrated, and I'm sorry. Your order is late, and that's on us. I've checked: it ships today and arrives by Thursday. If you'd rather not wait, reply \"refund\" and I'll process it within 24 hours." }] },
  { say: 'But look at the *smartest* part. It gives them a *choice*.', do: [{ rehook: true }, { mark: 'reply "refund"' }, { react: '🤝' }] },
  { say: 'Choices calm people down. Save this for the next angry message!', do: [{ cta: { text: 'SAVE THIS', sub: 'for your next angry customer' } }] },
]);

S('V08', { title: '"Make it better" is the worst prompt you can type' }, [
  { say: '"Make it better"... is the *worst* prompt you can type.', do: [{ hook: { lines: ['"MAKE IT BETTER"', 'IS THE *WORST*', 'PROMPT'], emoji: '🚫', tone: 'red' } }] },
  { say: 'Better *how*? The AI has to guess... so it just adds *fancy* words.', do: [{ label: 'MYTH BUST · EDITING' }, { user: 'make it better' }, { ai: "In today's fast-paced, ever-evolving landscape, leveraging synergies is paramount..." }] },
  { say: 'Leveraging synergies? *Nobody* talks like that.', do: [{ mark: 'leveraging synergies' }, { stamp: { text: 'WORSE', tone: 'red' } }, { react: '🤮' }] },
  { say: 'Instead, give it *three* exact instructions.', do: [{ rehook: true }, { clear: true }, { user: 'Make it 30% shorter. Cut all jargon. Add one concrete example.' }] },
  { say: '*Now* the edit actually has a direction!', do: [{ ai: 'Teams that share one weekly plan finish projects faster. Example: our design team cut review time from 5 days to 2.' }, { stamp: { text: 'BETTER', tone: 'lime' } }] },
  { say: 'Follow for more... and *never* type "make it better" again.', do: [{ cta: { text: 'FOLLOW', sub: 'for daily AI shortcuts' } }] },
]);

S('V09', { title: 'Stop re-reading your notes (learn backwards with AI)' }, [
  { say: "Stop re-reading your notes. It's the *slowest* way to learn.", do: [{ hook: { lines: ['STOP', 'RE-READING', 'YOUR *NOTES*'], emoji: '🛑', tone: 'red' } }] },
  { say: 'Do it *backwards*. *You* explain the topic... and the AI checks you.', do: [{ label: 'PROMPT #3 · THE FEYNMAN METHOD' }, { user: "I'll explain photosynthesis. Tell me what I got wrong or missed. Plants eat sunlight and turn it into oxygen." }] },
  { say: 'I gave a lazy answer on purpose. Watch what it *catches*.', do: [{ ai: "Close, but two gaps: plants don't eat sunlight. They use its energy to turn water and carbon dioxide into glucose, their food. Oxygen is a by-product, not the goal." }] },
  { say: "That's *exactly* the mistake that loses marks in the exam.", do: [{ mark: "plants don't eat sunlight" }, { react: '🎯' }] },
  { say: 'Now push it *one* step further.', do: [{ rehook: true }, { user: 'Ask me one question to check I really get it now.' }] },
  { say: 'If you can answer this... you *really* understand it.', do: [{ ai: 'If a plant is kept in the dark for a week, what happens to its glucose production, and why?' }, { zoom: true }] },
  { say: 'Comment your answer below! And stop re-reading your notes.', do: [{ cta: { text: 'COMMENT YOUR ANSWER', sub: '👇 I reply to every one' } }] },
]);

S('V10', { title: 'Why your coworkers finish hours earlier (15 AI prompts)' }, [
  { say: 'Your coworkers are finishing *hours* earlier... and this is why.', do: [{ hook: { lines: ['WHY THEY', 'FINISH', '*HOURS* EARLIER'], emoji: '💼', tone: 'lime' } }] },
  { say: 'Fifteen AI prompts for office work. *Pause*, and save this!', do: [{ label: 'SAVE THIS · OFFICE' }, { list: { title: '15 prompts for office work', items: [
    'Summarise this email thread and list what I must reply to',
    'Turn my bullet points into a polite email under 120 words',
    'Make an agenda for a 30-minute meeting about [topic]',
    'Turn these meeting notes into action items: who, what, when',
    'Write a formula: [describe your columns and goal]',
    'Rewrite this so a busy manager reads it in 20 seconds',
    'Say no to this request politely, and offer an alternative',
    'Make a one-page project update from these notes',
    "Find the risks in this plan I haven't thought about",
    'Turn this report into 5 slide titles with key points',
    "Write a follow-up for a client who hasn't replied in a week",
    'Explain this technical issue to a non-technical boss',
    'Prioritise my to-do list by urgency and impact',
    'Draft a job description for [role] with must-haves only',
    'Prepare 5 tough questions my boss might ask about this',
  ] } }] },
  { say: 'Number *seven* saves you awkward conversations. It helps you say *no*... politely.', do: [{ hl: 7 }] },
  { say: 'And number *fifteen* makes you look prepared in *every* meeting.', do: [{ rehook: true }, { hl: 15 }] },
  { say: 'Screenshot it now... and finish *hours* earlier too!', do: [{ cta: { text: 'SCREENSHOT NOW', sub: 'and finish hours earlier 💼' } }] },
]);
