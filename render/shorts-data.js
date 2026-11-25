// Content for every animated Short. Render with: node render/render-all.js  (or one: node render/render.js "render/short.html#S02" output/S02.mp4)
// Markup inside text: *lime*  ~blue~  !red!  ^grey^  and \n for a line break. Don't use those symbols as normal punctuation.
// Scene types: hook | big | chat | type | list | compare  (+ optional icon, tag, stamp, sub). dur = seconds.
window.HANDLE = '@AIShortcutLab';
window.SHORTS = {};
const add = (id, title, scenes) => (window.SHORTS[id] = { id, title, scenes });

add('S02', 'Make AI edit itself (free second draft)', [
  { type: 'hook', dur: 3, tag: 'AI WRITING TIP', title: "AI's first answer\nis *never* its best" },
  { type: 'mid', dur: 5, title: 'After any answer,\ntype this:' , sub: '^(works in ChatGPT, Claude, Gemini)^', subAt: 1.2 },
  { type: 'type', dur: 7.5, title: 'The *editor* prompt', text: 'Act as a strict editor. List the 3 biggest weaknesses, then rewrite it fixing them.', cps: 17 },
  { type: 'compare', dur: 6, title: 'The result', bad: { label: 'DRAFT 1', text: 'Long, vague, repeats itself' }, good: { label: 'DRAFT 2', text: 'Sharper, clearer, *40% shorter*' }, goodAt: 1.8 },
  { type: 'big', dur: 3, icon: 'save', title: 'Free editor.\nSave this.', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S03', 'Write any email in 20 seconds with AI', [
  { type: 'hook', dur: 3, tag: 'EMAIL HACK', title: 'Stop writing\nemails from\n*scratch*' },
  { type: 'chat', dur: 6, title: 'Dump messy\n*bullet points*', msgs: [{ from: 'user', text: '- meeting moved to thu\n- need report by wed\n- thanks for patience' }] },
  { type: 'type', dur: 7, title: 'Then add:', text: 'Turn this into a polite, clear email under 120 words. Friendly but professional.', cps: 17 },
  { type: 'chat', dur: 5.5, title: '*20 seconds.* Done.', msgs: [{ from: 'ai', text: 'Hi team, quick update: our meeting is moving to Thursday. Could you share the report by Wednesday? Thanks for your patience...' }] },
  { type: 'big', dur: 3, icon: 'warn', title: 'Always read it\nbefore sending', sub: "You're still the boss." },
]);

add('S04', 'Learn anything faster with this AI prompt', [
  { type: 'hook', dur: 3, tag: 'STUDY HACK', title: 'Understand\n*ANY* topic\nin 1 minute' },
  { type: 'type', dur: 7.5, title: 'Paste the topic, then:', text: 'Explain this like I\'m 12. Give one real-life example. Then quiz me with 3 questions.', cps: 16 },
  { type: 'list', dur: 6, title: 'You get', items: ['A *simple* explanation', 'A *real-life* example', 'A *quiz* to test yourself'], gap: 0.9 },
  { type: 'big', dur: 3.5, icon: 'bolt', title: "That's how you\n*actually* learn", sub: 'Not just read.' },
  { type: 'big', dur: 3, icon: 'save', title: 'Save this\nfor exams', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S05', 'Turn messy meeting notes into action items with AI', [
  { type: 'hook', dur: 3, tag: 'WORK HACK', title: 'Never take\nmeeting notes\n*again*' },
  { type: 'type', dur: 8, title: 'Paste notes or transcript:', text: 'Give me a 5-line summary, the decisions made, and a table of action items with who and when.', cps: 16 },
  { type: 'list', dur: 6, title: 'In seconds you get', items: ['*Summary* in 5 lines', 'Every *decision* made', '*Action items* with owners and dates'], gap: 0.9 },
  { type: 'big', dur: 4, icon: 'warn', title: 'Check your\ncompany rules', sub: "Don't paste anything *!confidential!*." },
  { type: 'big', dur: 3, icon: 'save', title: 'Save this', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S06', 'Make your resume match any job with AI', [
  { type: 'hook', dur: 3, tag: 'CAREER HACK', title: 'Your resume\nis getting\n*!ignored!*' },
  { type: 'big', dur: 4, title: 'Paste the\n*job post* +\nyour *resume*' },
  { type: 'type', dur: 9, title: 'Then ask:', text: 'Which skills from this job are missing from my resume? Rewrite my bullets with numbers, using only facts I gave you.', cps: 16 },
  { type: 'compare', dur: 6, title: 'Bullet upgrade', bad: { label: 'BEFORE', text: 'Responsible for social media' }, good: { label: 'AFTER', text: 'Grew Instagram *+2,400 followers* in 6 months' }, goodAt: 1.8 },
  { type: 'big', dur: 3, icon: 'warn', title: 'Never let AI\n*invent* experience', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S07', 'Why you should give AI a role', [
  { type: 'hook', dur: 3, tag: 'PROMPT TIP', title: 'Same AI.\n*2 totally\ndifferent* answers' },
  { type: 'chat', dur: 6, title: 'Without a role', msgs: [{ from: 'user', text: 'how do I save money' }, { from: 'ai', text: 'Make a budget, cut unnecessary spending, cook at home...' }], stamp: { text: 'GENERIC', at: 3.4 } },
  { type: 'chat', dur: 7, title: 'With a *role*', msgs: [{ from: 'user', text: "You're a financial coach for students on a tiny budget. Give me a realistic weekly plan." }, { from: 'ai', text: 'Mon: plan 5 meals under $25. Tue: cancel 1 unused subscription...' }], stamp: { text: 'USEFUL', good: true, at: 3.6 } },
  { type: 'big', dur: 3, icon: 'bolt', title: 'Always start\nwith a *role*', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S08', 'Never trust AI numbers without this check', [
  { type: 'hook', dur: 3, tag: 'AI WARNING', title: 'AI lied to me.\n*!Confidently.!*' },
  { type: 'list', dur: 6.5, title: 'AI can invent', items: ['*Statistics* that look real', '*Quotes* nobody said', '*Sources* that don\'t exist'], gap: 0.9 },
  { type: 'big', dur: 5, title: 'The rule:\nclick the\n*original source*', sub: 'For every number, date and quote.' },
  { type: 'big', dur: 4.5, icon: 'check', title: 'Use AI search\nwith *citations*', sub: '...and actually open them.' },
  { type: 'big', dur: 3, icon: 'save', title: 'Trust,\nbut *verify*.', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S09', 'Plan your whole week in 30 seconds with AI', [
  { type: 'hook', dur: 3, tag: 'PRODUCTIVITY', title: 'Let AI plan\nyour *whole week*' },
  { type: 'list', dur: 6, title: 'Tell it 3 things', items: ['Your *goals*', 'Fixed *commitments*', 'Free *hours* per day'], gap: 0.9 },
  { type: 'type', dur: 7.5, title: 'Then ask:', text: 'Build a realistic weekly schedule with breaks. Put the hardest task in my morning.', cps: 17 },
  { type: 'big', dur: 4, icon: 'check', title: 'A full plan\nin *seconds*', sub: "It's a draft, not a prison. Adjust it." },
  { type: 'big', dur: 3, icon: 'save', title: 'Save this\nfor Sunday', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S10', 'The honest truth about making money with AI', [
  { type: 'hook', dur: 3, tag: 'SIDE HUSTLE', title: 'The *truth*\nabout AI\nside hustles' },
  { type: 'big', dur: 4, title: 'AI won\'t make\nyou rich\n*!overnight.!*' },
  { type: 'big', dur: 4.5, icon: 'bolt', title: 'But it lets *1 person*\ndo the work of *3*' },
  { type: 'list', dur: 6, title: 'So you can sell', items: ['*Writing* services', '*Video editing*', '*Design* and templates'], gap: 0.8 },
  { type: 'big', dur: 4.5, title: 'The money is in\nsolving a *real\nproblem*, faster', sub: 'Follow for daily *AI shortcuts*', subAt: 1.4 },
]);

add('S11', 'Turn your notes into an AI tutor', [
  { type: 'hook', dur: 3, tag: 'STUDY HACK', title: 'Turn your notes\ninto a *personal\ntutor*' },
  { type: 'big', dur: 4.5, title: 'Upload notes or\nPDFs to an AI that\nanswers *from your files*', sub: '^e.g. NotebookLM^', subAt: 1.4 },
  { type: 'type', dur: 7.5, title: 'Then ask:', text: 'Quiz me on chapter 3, one question at a time, and explain my mistakes.', cps: 16 },
  { type: 'big', dur: 4, icon: 'check', title: 'Focused on\n*exactly* your exam', sub: 'It only uses your material.' },
  { type: 'big', dur: 3, icon: 'save', title: 'Save this', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S12', 'Let AI decide dinner from your fridge', [
  { type: 'hook', dur: 3, tag: 'LIFE HACK', title: 'What can I\ncook with\n*THIS?*' },
  { type: 'chat', dur: 6.5, title: 'Snap or list\nyour *fridge*', msgs: [{ from: 'user', text: 'eggs, spinach, rice, onion, half a lemon, cheese' }] },
  { type: 'type', dur: 6.5, title: 'Ask:', text: 'Give me 3 dinners using only these, under 30 minutes, with steps.', cps: 16 },
  { type: 'list', dur: 5.5, title: 'Dinner, *solved*', items: ['Spinach cheese omelette', 'Lemon egg fried rice', 'Cheesy spinach rice bake'], gap: 0.7 },
  { type: 'big', dur: 3, icon: 'check', title: 'No more\n*wasted food*', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S13', 'The pro trick for consistent AI results', [
  { type: 'hook', dur: 3, tag: 'PRO PROMPTING', title: 'Stop describing.\n*Start showing.*' },
  { type: 'compare', dur: 6.5, title: 'Two ways to ask', bad: { label: 'WEAK', text: '"Make it catchy and fun"' }, good: { label: 'PRO', text: 'Paste *2 examples* you love + "write a 3rd in exactly this style"' }, goodAt: 2.0 },
  { type: 'big', dur: 4.5, icon: 'bolt', title: 'AI is amazing at\ncopying *patterns*' },
  { type: 'big', dur: 4.5, title: '*1 good example*\nbeats 10\nadjectives' },
  { type: 'big', dur: 3, icon: 'save', title: 'Save this', sub: 'Follow for daily *AI shortcuts*' },
]);

add('S14', 'Practice hard conversations with AI role-play', [
  { type: 'hook', dur: 3, tag: 'CAREER HACK', title: 'Practice your\n*salary talk*\nwith AI' },
  { type: 'type', dur: 9, title: 'Prompt:', text: "Role-play as my manager. I'm asking for a raise. Push back realistically. After 5 replies, give me feedback.", cps: 16 },
  { type: 'chat', dur: 6.5, title: 'It pushes back', msgs: [{ from: 'ai', text: "Budgets are tight this year. What makes now the right time?" }, { from: 'user', text: 'I led 3 projects that saved 120 hours a month...' }] },
  { type: 'big', dur: 3.5, icon: 'check', title: 'Practice once.\nThe real one gets\n*much easier*', sub: 'Follow for daily *AI shortcuts*', subAt: 1.2 },
]);

add('S15', 'The only AI prompt template you need (save this)', [
  { type: 'hook', dur: 3, tag: 'SCREENSHOT THIS', title: 'The only prompt\ntemplate you\n*need*' },
  { type: 'list', dur: 9, title: 'Fill in the blanks', items: ['You are a *[role]*', 'Your task is to *[action]*', 'The audience is *[who]*', 'Format it as *[format + length]*', 'Style example: *[paste one]*', 'Ask me questions *first*'], gap: 0.75 },
  { type: 'big', dur: 4, icon: 'bolt', title: 'Role. Task.\nContext. Format.\n*Example.*' },
  { type: 'big', dur: 3.5, icon: 'save', title: 'Screenshot it.\nUse it *daily*.', sub: 'Follow for daily *AI shortcuts*' },
]);
