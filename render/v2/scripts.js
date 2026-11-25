// Version 2 Shorts. Each Short is a list of "beats": `say` is spoken by the voice (and shown as captions),
// `do` is what happens on screen while it's said.
// Actions:
//   {user:'text'} / {ai:'text'}   add a chat bubble (AI text streams in over the beat)
//   {clear:true}                  empty the chat
//   {card:{text, emoji, tone}}    full-screen statement card (tone: 'dark' | 'lime' | 'red')
//   {cardOff:true}                remove the card
//   {list:{title, items}}         fast-scrolling list (save-bait)
//   {split:{bad, good}}           before/after panels
//   {react:'emoji'}               emoji pops on screen
//   {label:'text'}                small label at top (series name)
//   {hl:n}                        highlight list item n (and scroll to it)
// Every AI reply here is a real answer to the exact prompt shown.
window.VOICE = 'af_heart';
window.V2 = {};
const S = (id, meta, beats) => (window.V2[id] = { id, ...meta, beats });

S('V01', { title: 'This prompt turns AI into a brutally honest mentor', format: 'One Prompt', tag: '#mindset' }, [
  { say: 'This prompt turns AI into a brutally honest mentor.', do: [{ label: 'PROMPT #1 · HONEST MENTOR' }, { user: "Be my brutally honest mentor. No flattery. Point out my excuses and blind spots. My situation: I've wanted to start a YouTube channel for a year but haven't posted once." }] },
  { say: "I told it I've been planning a YouTube channel for a whole year. Look at the reply.", do: [{ ai: "You don't have a planning problem. You have a fear-of-being-judged problem. A year of \"preparing\" is avoidance with a to-do list. Your first video will be bad. Post it anyway, by Friday at 6 pm." }] },
  { say: 'Ouch.', do: [{ react: '💀' }] },
  { say: 'But most people stop there. Add this one line at the end.', do: [{ user: 'Now ask me the one hard question I keep avoiding.' }] },
  { say: 'And it asks the question you really need to hear.', do: [{ ai: 'If nobody watched for the next six months, would you still post every week?' }] },
  { say: "Save it for the day you need a push. Because this prompt turns AI into a brutally honest mentor.", do: [{ react: '🔖' }] },
]);

S('V02', { title: 'AI agrees with you even when you are wrong. Fix it like this', format: 'Myth Bust', tag: '#chatgpt' }, [
  { say: 'Your AI is lying to you. To be nice.', do: [{ card: { text: 'Your AI is lying to you.\n*To be nice.*', emoji: '🤥', tone: 'dark' } }] },
  { say: 'AI chatbots are trained to be helpful, so they often agree with whatever you say.', do: [{ cardOff: true }, { label: 'MYTH BUST · AI FLATTERY' }, { user: "My business idea: selling ice to people in Alaska. Brilliant, right?" }] },
  { say: 'So add this line, and watch the answer change.', do: [{ user: 'Be honest. No flattery. Disagree with me if I am wrong.' }] },
  { say: 'Now it actually pushes back.', do: [{ ai: "Honestly? Not as stated. Demand is low and anyone there can make ice for free. But one version could work: crystal-clear premium ice for cocktail bars and events. People do pay for that." }] },
  { say: 'And here is the part nobody notices. It also found the version that could work.', do: [{ react: '🤯' }] },
  { say: 'Use that line every time you ask for feedback. Because by default, your AI is lying to you. To be nice.', do: [{ card: { text: 'Add to every feedback prompt:\n*"No flattery. Disagree if I\'m wrong."*', emoji: '✅', tone: 'lime' } }] },
]);

S('V03', { title: '25 AI prompts every student should steal', format: 'Mega List', tag: '#studytips' }, [
  { say: 'Twenty five AI prompts every student should steal. Do not try to read them all. Just save this.', do: [{ label: 'SAVE THIS · STUDENTS' }, { list: { title: '25 AI prompts for students', items: [
    'Explain [topic] like I\'m 12, then like a professor',
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
    'I\'ll explain [topic]. Tell me what I missed',
    'Compare [A] and [B] in a table',
    'Rewrite my essay intro to be clearer, not fancier',
    'Give me an essay outline for: [question]',
    'Which part of my essay is weakest and why?',
    'Make a mind map of [topic] in text',
    'Give me practice problems, easy to hard',
    'Check my solution. Don\'t give the answer, give a hint',
    'Translate this jargon into plain English',
    'What should I learn first to understand [topic]?',
    'Make a cheat sheet for [topic] on one page',
    'Test me like a strict examiner on [topic]',
  ] } }] },
  { say: 'Number fourteen is the one most people skip. You explain the topic, and the AI tells you exactly what you missed.', do: [{ hl: 14 }] },
  { say: 'And number twenty one is how you use AI without cheating yourself. It gives you a hint, not the answer.', do: [{ hl: 21 }] },
  { say: 'Screenshot the ones you need. Twenty five AI prompts every student should steal.', do: [{ react: '📚' }] },
]);

S('V04', { title: 'Stop googling Excel formulas. Do this instead', format: 'Real Work Demo', tag: '#excel' }, [
  { say: 'Stop googling Excel formulas.', do: [{ card: { text: 'Stop googling\n*Excel formulas*', emoji: '🛑', tone: 'red' } }] },
  { say: 'Just describe your sheet in plain English, like this.', do: [{ cardOff: true }, { label: 'REAL WORK · EXCEL' }, { user: 'Column A has dates. Column B has sales. Give me one formula for total sales in March 2026.' }] },
  { say: 'And you get the exact formula in seconds.', do: [{ ai: '=SUMIFS(B:B, A:A, ">="&DATE(2026,3,1), A:A, "<"&DATE(2026,4,1))' }] },
  { say: 'But do not just paste it. Ask one more thing, so you actually learn it.', do: [{ user: 'Explain each part in one line.' }] },
  { say: 'Now you understand it, and you can change it yourself next time.', do: [{ ai: 'SUMIFS adds column B, but only rows where column A is on or after March 1st, and before April 1st.' }, { react: '✅' }] },
  { say: 'Follow for part two, where AI builds the whole dashboard. And stop googling Excel formulas.', do: [] },
]);

S('V05', { title: 'Your prompt vs a pro prompt (cover letter)', format: 'Before → After', tag: '#jobsearch' }, [
  { say: 'This is why your AI cover letter sounds like everyone else\'s.', do: [{ label: 'BEFORE → AFTER · COVER LETTER' }, { split: { bad: { prompt: 'write a cover letter for a marketing job', out: 'Dear Hiring Manager, I am writing to express my strong interest in the Marketing position at your esteemed company...' } } }] },
  { say: '"Esteemed company." Every recruiter has read that line a thousand times.', do: [{ react: '🥱' }] },
  { say: 'Now give it three things: the job post, one real result of yours, and a tone.', do: [{ split: { bad: { prompt: 'write a cover letter for a marketing job', out: 'Dear Hiring Manager, I am writing to express my strong interest in the Marketing position at your esteemed company...' }, good: { prompt: 'Job post: [paste]. My best result: grew a café\'s Instagram from 800 to 6,000 followers in 5 months. Tone: confident, simple, no clichés. Under 200 words.', out: 'Five months ago, a small café had 800 Instagram followers. Today it has 6,000, and weekend sales are up. I\'d like to do the same for your brand...' } } }] },
  { say: 'Same AI. One sounds like a template. One sounds like a person who gets results.', do: [{ react: '🔥' }] },
  { say: 'Job post, one real result, one tone. That is why your cover letter will not sound like everyone else\'s.', do: [] },
]);

S('V06', { title: 'Most people never let AI interview them', format: 'Hidden Trick', tag: '#promptengineering' }, [
  { say: 'Most people never let the AI interview them first. Big mistake.', do: [{ label: 'HIDDEN TRICK · PROMPT #2' }, { user: 'Plan a 3-day trip to Istanbul for me.' }] },
  { say: 'Ask normally, and you get a generic plan made for everybody.', do: [{ ai: 'Day 1: Hagia Sophia, Blue Mosque, Grand Bazaar. Day 2: Bosphorus cruise...' }, { react: '😴' }] },
  { say: 'Now add one line.', do: [{ clear: true }, { user: 'Plan a 3-day trip to Istanbul for me. Before you start, ask me any questions you need to do this well.' }] },
  { say: 'Watch. It asks about your budget, your pace, food, and the kind of trip you actually want.', do: [{ ai: '1. What\'s your budget per day?\n2. Relaxed or packed schedule?\n3. Any food you love or avoid?\n4. History, shopping, nightlife, or views?' }] },
  { say: 'Your answers make the plan yours, not everyone\'s. That is the trick most people never use. Let the AI interview you first.', do: [{ react: '🎯' }] },
]);

S('V07', { title: 'Reply to an angry customer in 10 seconds with AI', format: 'Real Work Demo', tag: '#smallbusiness' }, [
  { say: 'An angry customer just messaged you. Do not reply yet.', do: [{ label: 'REAL WORK · CUSTOMER SERVICE' }, { user: "Angry customer: \"My order is 5 days late. This is the worst service ever. I want a refund NOW.\"" }, { react: '😡' }] },
  { say: 'Paste it into AI with this prompt.', do: [{ user: 'Write a calm, short reply. Apologise once, take responsibility, give a clear next step and a timeline. No corporate language.' }] },
  { say: 'Ten seconds later, you have this.', do: [{ ai: "You're right to be frustrated, and I'm sorry. Your order is late, and that's on us. I've checked: it ships today and arrives by Thursday. If you'd rather not wait, reply \"refund\" and I'll process it within 24 hours." }] },
  { say: 'Notice the trick. It gives the customer a choice. That is what turns an angry customer into a loyal one.', do: [{ react: '🤝' }] },
  { say: 'Save this for the next time an angry customer messages you.', do: [] },
]);

S('V08', { title: "Stop telling AI to 'make it better'", format: 'Myth Bust', tag: '#writingtips' }, [
  { say: 'Stop telling AI to make it better.', do: [{ card: { text: 'Stop saying\n*"make it better"*', emoji: '🚫', tone: 'red' } }] },
  { say: 'Better how? The AI has to guess. So it just adds fancier words.', do: [{ cardOff: true }, { label: 'MYTH BUST · EDITING' }, { user: 'make it better' }, { ai: 'In today\'s fast-paced, ever-evolving landscape, leveraging synergies is paramount...' }, { react: '🤮' }] },
  { say: 'Instead, give it three specific instructions.', do: [{ clear: true }, { user: 'Make it 30% shorter. Cut all jargon. Add one concrete example.' }] },
  { say: 'Now the edit actually has a direction.', do: [{ ai: 'Teams that share one weekly plan finish projects faster. Example: our design team cut review time from 5 days to 2.' }, { react: '✅' }] },
  { say: 'Shorter, simpler, one example. Say what better means, and stop telling AI to make it better.', do: [] },
]);

S('V09', { title: 'The Feynman prompt: learn anything by explaining it to AI', format: 'One Prompt', tag: '#studytips' }, [
  { say: 'The fastest way to learn anything with AI is backwards. You do the explaining.', do: [{ label: 'PROMPT #3 · THE FEYNMAN METHOD' }, { user: "I'll explain photosynthesis. Tell me what I got wrong or missed. Plants eat sunlight and turn it into oxygen." }] },
  { say: 'I gave a lazy explanation on purpose. Watch what it catches.', do: [{ ai: "Close, but two gaps: plants don't eat sunlight. They use its energy to turn water and carbon dioxide into glucose, their food. Oxygen is a by-product, not the goal." }] },
  { say: 'That is the exact gap you would have lost marks for in the exam.', do: [{ react: '🎯' }] },
  { say: 'Now push it one step further.', do: [{ user: 'Ask me one question to check I really get it now.' }] },
  { say: 'If you can answer, you understand it. That is why the fastest way to learn anything with AI is backwards.', do: [{ ai: 'If a plant is kept in the dark for a week, what happens to its glucose production, and why?' }] },
]);

S('V10', { title: '15 AI prompts that save office workers hours', format: 'Mega List', tag: '#productivity' }, [
  { say: 'Fifteen AI prompts that save office workers hours every week. Save this, you will need it on Monday.', do: [{ label: 'SAVE THIS · OFFICE' }, { list: { title: '15 prompts for office work', items: [
    'Summarise this email thread and list what I must reply to',
    'Turn my bullet points into a polite email under 120 words',
    'Make an agenda for a 30-minute meeting about [topic]',
    'Turn these meeting notes into action items: who, what, when',
    'Write a formula: [describe your columns and goal]',
    'Rewrite this so a busy manager reads it in 20 seconds',
    'Say no to this request politely, and offer an alternative',
    'Make a one-page project update from these notes',
    'Find the risks in this plan I haven\'t thought about',
    'Turn this report into 5 slide titles with key points',
    'Write a follow-up for a client who hasn\'t replied in a week',
    'Explain this technical issue to a non-technical boss',
    'Prioritise my to-do list by urgency and impact',
    'Draft a job description for [role] with must-haves only',
    'Prepare 5 tough questions my boss might ask about this',
  ] } }] },
  { say: 'Number seven alone saves you awkward conversations. AI helps you say no, politely.', do: [{ hl: 7 }] },
  { say: 'And number fifteen is the one that makes you look prepared in every meeting.', do: [{ hl: 15 }] },
  { say: 'Screenshot your favourites. Fifteen prompts that save office workers hours.', do: [{ react: '💼' }] },
]);
