// Test definitions. Every question is a scenario with four responses, written here
// from lowest (0) to highest (3) on the question's dimension. The display order is
// shuffled per question so the "high" answer isn't always in the same place.

function byTop(map) {
  return (scores) => {
    const top = [...scores].sort((a, b) => b.pct - a.pct)[0];
    return map[top.key];
  };
}

function byOverall(bands, valueFn) {
  return (scores) => {
    const v = valueFn ? valueFn(scores) : scores.reduce((s, d) => s + d.pct, 0) / scores.length;
    const band = bands.find((b) => v >= b.min);
    return { ...band, score: Math.round(v) };
  };
}

const pick = (scores, key) => scores.find((d) => d.key === key).pct;

// Careers for the Career Match test, tagged with Holland (RIASEC) codes.
// `stream` + `school` guide Class 9–10 students, `student` is the route in after school,
// and `pro` is how a working professional could switch.
const CAREERS = [
  { code: "RIC", title: "Mechanical Engineer", desc: "Design and build machines, engines and manufacturing systems.",
    stream: "PCM", school: "Enjoy maths and physics? Try a robotics club or a science-fair project.",
    student: "PCM → JEE Main/Advanced → B.Tech in Mechanical Engineering.",
    pro: "Usually needs an engineering degree. From related fields, try CAD design (SolidWorks/AutoCAD certification) or manufacturing operations." },
  { code: "RIC", title: "Civil Engineer", desc: "Plan and oversee roads, bridges, buildings and infrastructure.",
    stream: "PCM", school: "Strong maths and physics matter. Start noticing how buildings and bridges are made.",
    student: "PCM → JEE → B.Tech in Civil Engineering. GATE opens PSU jobs.",
    pro: "Needs a civil degree. Adjacent routes: site supervision, project coordination or a quantity surveying certification." },
  { code: "RCI", title: "Electrician / Technician", desc: "Install, maintain and repair electrical and technical systems.",
    stream: "Any", school: "You can join an ITI right after Class 10. Practical skills matter more than marks.",
    student: "ITI or a polytechnic diploma after Class 10 or 12.",
    pro: "Short ITI or NSDC skill courses. An apprenticeship gets you working fast." },
  { code: "RIE", title: "Pilot", desc: "Fly commercial or private aircraft safely to their destinations.",
    stream: "PCM", school: "Physics and maths are required in Class 12. Keep your eyesight and fitness in good shape.",
    student: "PCM in Class 12 → DGCA exams → flying school for a CPL (about 200 flight hours).",
    pro: "Possible into your 30s: clear DGCA medicals and exams, then CPL training. The cost and time are significant." },
  { code: "RAE", title: "Chef", desc: "Create dishes, run kitchens and build a food brand.",
    stream: "Any", school: "Cook at home, experiment with recipes, and look at hotel management after Class 12.",
    student: "Hotel management (NCHM JEE) or a culinary arts diploma.",
    pro: "A short culinary course plus kitchen experience. Many start with a home or cloud kitchen." },
  { code: "SRI", title: "Physiotherapist", desc: "Help people recover movement and strength after injury.",
    stream: "PCB", school: "Biology matters most. An interest in sport and fitness is a plus.",
    student: "PCB → BPT (Bachelor of Physiotherapy).",
    pro: "Requires a BPT degree. A fitness trainer certification is a faster adjacent route." },
  { code: "AIR", title: "Architect", desc: "Design buildings and spaces that are beautiful and functional.",
    stream: "PCM", school: "Maths is required. Practise sketching and drawing for the NATA entrance.",
    student: "PCM → NATA or JEE Paper 2 → B.Arch (5 years).",
    pro: "Licensing needs a B.Arch. Interior design or 3D visualisation courses are quicker adjacent routes." },
  { code: "IRC", title: "Software Developer", desc: "Build the apps, websites and systems people use every day.",
    stream: "PCM", school: "PCM opens the most doors, but start coding now with free Scratch or Python courses.",
    student: "Any stream works. B.Tech CS or BCA helps. Build projects and do internships early.",
    pro: "One of the most switchable careers: learn through a bootcamp or online courses, build a GitHub portfolio and start with internal tech tasks." },
  { code: "ICR", title: "Data Scientist", desc: "Turn raw data into insights, predictions and decisions.",
    stream: "PCM", school: "Love maths? Build on it with statistics and basic Python.",
    student: "B.Tech or B.Sc in CS, maths or statistics. Learn Python, SQL and machine learning.",
    pro: "Start with Excel and SQL analysis in your current job, then learn Python and ML. Analyst → data scientist is a common path." },
  { code: "IAR", title: "Game Developer", desc: "Combine code, design and storytelling to build games.",
    stream: "PCM", school: "Try making simple games in Scratch or Unity. Maths and art both help.",
    student: "B.Tech CS or a game design degree. Build small games in Unity or Unreal.",
    pro: "Learn Unity or Unreal, publish small games online, then join a studio as a junior developer." },
  { code: "ISR", title: "Doctor", desc: "Diagnose and treat patients, and specialise in an area of medicine.",
    stream: "PCB", school: "Biology and chemistry are key. NEET preparation usually starts in Class 11.",
    student: "PCB → NEET UG → MBBS (5.5 years) → NEET PG to specialise.",
    pro: "Very hard to switch into later. Consider health-tech, public health (MPH) or allied health roles." },
  { code: "IRA", title: "Research Scientist", desc: "Run experiments and push the boundaries of what's known.",
    stream: "PCM", school: "Choose PCM or PCB based on your favourite science, and try science olympiads.",
    student: "B.Sc/B.Tech → M.Sc/M.Tech → PhD. IISER and IISc entrances are great routes.",
    pro: "Usually needs a master's or PhD. Industry R&D roles may value strong domain experience." },
  { code: "ISA", title: "Psychologist", desc: "Understand behaviour and help people improve their mental health.",
    stream: "Arts", school: "Psychology is offered in Arts (and some Science) streams. Read about how people think and behave.",
    student: "Any stream → BA/B.Sc Psychology → MA/M.Sc → M.Phil (RCI) for clinical practice.",
    pro: "Start with a counselling certification, then a part-time master's in psychology." },
  { code: "ICS", title: "Pharmacist", desc: "Ensure medicines are used safely and effectively.",
    stream: "PCB", school: "Chemistry is the key subject. PCB or PCM both work.",
    student: "PCB or PCM → B.Pharm. GPAT for higher studies.",
    pro: "Needs a B.Pharm. Pharma sales or regulatory affairs are adjacent switches." },
  { code: "ICE", title: "Actuary", desc: "Use maths and statistics to measure financial risk.",
    stream: "Commerce", school: "Maths is essential, so take Commerce with maths, or Science (PCM).",
    student: "Strong maths → clear the IAI actuarial exams alongside any degree.",
    pro: "Clear IAI exams part-time. Finance and analytics backgrounds switch well." },
  { code: "AIS", title: "UX Designer", desc: "Design apps and websites that are easy and enjoyable to use.",
    stream: "Any", school: "Any stream works. Sketch app ideas and look at design entrances like UCEED.",
    student: "B.Des (UCEED or NID entrance), or any degree plus a strong UX portfolio.",
    pro: "Very switchable: take a UX course, redesign real apps for your portfolio and move into a design role." },
  { code: "AER", title: "Graphic Designer", desc: "Create visual identities, ads, illustrations and layouts.",
    stream: "Arts", school: "Any stream works. Build an art portfolio and explore design schools like NID.",
    student: "B.Des or BFA, or self-taught with a strong portfolio.",
    pro: "Learn Figma and Adobe tools, freelance on the side and build a portfolio." },
  { code: "AES", title: "Journalist", desc: "Investigate, write and tell the stories that matter.",
    stream: "Arts", school: "Write for your school magazine and read the news every day.",
    student: "BA in Journalism or Mass Communication (IIMC is top), or any degree plus writing samples.",
    pro: "Start freelancing on your area of expertise. Domain experts make strong reporters." },
  { code: "ASI", title: "Writer / Content Creator", desc: "Write books, scripts, blogs or social content.",
    stream: "Arts", school: "Read widely and write often. A blog or school magazine is a great start.",
    student: "Any degree. Start a blog, newsletter or channel now.",
    pro: "Publish consistently alongside your job. Content marketing is a common bridge role." },
  { code: "AER", title: "Film-maker / Video Creator", desc: "Plan, shoot and edit films, ads and online videos.",
    stream: "Arts", school: "Shoot short videos on your phone and learn basic editing.",
    student: "Mass media or film school (FTII, SRFTI), or start shooting on your phone today.",
    pro: "Short editing courses plus a YouTube or Instagram portfolio. Corporate video roles are a good bridge." },
  { code: "ASE", title: "Musician / Performer", desc: "Create and perform music, theatre or dance.",
    stream: "Any", school: "Keep training seriously alongside school. Consistency matters most.",
    student: "Formal training (guru, conservatory or a BPA degree) plus regular performing.",
    pro: "Perform and post online alongside your job. Teaching is a stable bridge." },
  { code: "SAI", title: "Teacher / Professor", desc: "Inspire and educate students in a subject you love.",
    stream: "Any", school: "Choose the stream of the subject you'd love to teach.",
    student: "Graduate → B.Ed for schools, or a master's + UGC NET for colleges.",
    pro: "Your experience counts: corporate trainer, online tutor, or a B.Ed to teach in schools." },
  { code: "SIR", title: "Nurse", desc: "Care for patients and support them through treatment.",
    stream: "PCB", school: "Biology is required for B.Sc Nursing.",
    student: "PCB → B.Sc Nursing or a GNM diploma.",
    pro: "Needs a nursing qualification. Healthcare administration is an adjacent route." },
  { code: "SAE", title: "Counsellor / Social Worker", desc: "Support people through life's challenges.",
    stream: "Arts", school: "Psychology and sociology in Arts are a great foundation.",
    student: "BA → MSW (TISS is top) or a counselling diploma.",
    pro: "A counselling certification or part-time MSW. NGO volunteering builds experience." },
  { code: "SEC", title: "HR Manager", desc: "Hire, develop and look after a company's people.",
    stream: "Commerce", school: "Any stream works; Commerce and Arts are common. Build people skills through school clubs.",
    student: "Any degree → MBA in HR (XLRI is top).",
    pro: "Move into recruiting or people operations internally, plus an HR certification." },
  { code: "ESA", title: "Entrepreneur", desc: "Spot opportunities and build your own business.",
    stream: "Commerce", school: "Any stream works; Commerce teaches business basics. Try running a stall at a school fair.",
    student: "Any stream. Join your campus E-cell, build small projects and intern at startups.",
    pro: "Validate an idea on the side, build savings and lean on your industry network." },
  { code: "ESC", title: "Sales / Business Development", desc: "Build relationships and win new customers.",
    stream: "Commerce", school: "Any stream works. Practise public speaking and join debates.",
    student: "Any degree. A BBA or MBA helps, and sales internships are gold.",
    pro: "One of the easiest switches: your industry knowledge sells. Start in inside sales or account management." },
  { code: "EAS", title: "Marketing Manager", desc: "Shape brands and campaigns that get people's attention.",
    stream: "Commerce", school: "Commerce is common. Notice the ads you love and work out why they work.",
    student: "BBA/BMS → MBA in Marketing. Learn digital marketing early.",
    pro: "Get a digital marketing certification and run campaigns for side projects." },
  { code: "EIS", title: "Lawyer", desc: "Advise clients and argue cases using the law.",
    stream: "Arts", school: "Any stream can take CLAT, but Arts helps. Join debate and MUN.",
    student: "CLAT or AILET after Class 12 → 5-year integrated LLB.",
    pro: "A 3-year LLB after any degree. Corporate compliance roles are a bridge." },
  { code: "ESC", title: "Civil Services (IAS / IPS)", desc: "Lead public administration and shape policy.",
    stream: "Arts", school: "Any stream works; history, polity and geography in Arts help later. Read the newspaper daily.",
    student: "Any degree → UPSC Civil Services Exam (age 21–32 for the general category).",
    pro: "Many clear UPSC while working. Check the age limit and plan 1–2 years of preparation." },
  { code: "EIA", title: "Product Manager", desc: "Decide what a product does and lead the team that builds it.",
    stream: "PCM", school: "PCM is the common route, but people reach this role from any stream.",
    student: "B.Tech or any degree, often plus an MBA. Build products and aim for APM internships.",
    pro: "A common switch from engineering, design, analytics or sales. Take on product tasks in your current company." },
  { code: "EAS", title: "Event Manager", desc: "Plan and run weddings, concerts and corporate events.",
    stream: "Any", school: "Volunteer to organise school events and fests.",
    student: "BBA or a diploma in event management. Volunteer at college fests.",
    pro: "Start with weekend events and freelancing. Hospitality experience transfers well." },
  { code: "CEI", title: "Chartered Accountant", desc: "Manage audits, taxes and financial reporting.",
    stream: "Commerce", school: "Commerce with maths and accountancy is the natural route.",
    student: "Commerce → CA Foundation → Intermediate → Final, with articleship.",
    pro: "Possible but long: CA Foundation after graduation. CMA or ACCA are alternatives." },
  { code: "CEI", title: "Financial Analyst / Banker", desc: "Analyse investments and manage money for clients.",
    stream: "Commerce", school: "Commerce with maths. Start learning how money and markets work.",
    student: "B.Com/BBA/Economics → MBA in Finance or the CFA.",
    pro: "Take CFA Level 1 or a financial modelling course. Analysts from any quantitative field switch well." },
  { code: "ECS", title: "Project Manager", desc: "Keep teams, timelines and budgets on track.",
    stream: "Any", school: "Any stream works. Lead school projects and clubs.",
    student: "Any degree. Lead projects in college now; an MBA or PMP can come later.",
    pro: "Very switchable: lead projects in your current role and get PMP or Scrum certified." },
  { code: "CER", title: "Operations / Supply Chain Manager", desc: "Make sure products move efficiently from source to customer.",
    stream: "Commerce", school: "Commerce or PCM both work. Get good at planning and organising.",
    student: "B.Tech/BBA → MBA in Operations (NITIE or IIMs).",
    pro: "Move into operations roles internally. A Six Sigma or supply chain certification helps." },
];

const RIASEC = {
  R: { name: "Builder", desc: "You're happiest building, fixing and working with your hands, tools or the outdoors." },
  I: { name: "Thinker", desc: "You're driven by curiosity and love analysing problems until you truly understand them." },
  A: { name: "Creator", desc: "You thrive when you can create, express ideas and do things your own way." },
  S: { name: "Helper", desc: "You're energised by helping, teaching and making a difference to people." },
  E: { name: "Persuader", desc: "You love leading, persuading and turning ideas into results." },
  C: { name: "Organiser", desc: "You excel at bringing order, accuracy and structure to complex work." },
};

const STREAMS = {
  PCM: "Science (PCM)",
  PCB: "Science (PCB)",
  Commerce: "Commerce",
  Arts: "Arts / Humanities",
  Any: "Any stream",
};

// Weight each stream by how highly its careers rank; "Any" careers don't vote.
function recommendStreams(ranked) {
  const votes = {};
  ranked.slice(0, 9).forEach((c, i) => {
    if (c.stream !== "Any") votes[c.stream] = (votes[c.stream] || 0) + (9 - i);
  });
  return Object.entries(votes).sort((a, b) => b[1] - a[1]).map(([k]) => STREAMS[k]);
}

// Rank careers by how well their code matches the user's type scores (first letter matters most).
function matchCareers(scores) {
  const pct = Object.fromEntries(scores.map((d) => [d.key, d.pct]));
  const weights = [1, 0.6, 0.35];
  return CAREERS.map((c) => ({ ...c, fit: [...c.code].reduce((s, k, i) => s + weights[i] * pct[k], 0) }))
    .sort((a, b) => b.fit - a.fit);
}

const TESTS = [
  {
    id: "career-match",
    emoji: "🚀",
    title: "Career Match Test",
    description:
      "Discover which careers fit your interests and personality. Get your career code and personalised advice: the right stream after Class 10, routes after school, or a plan to switch careers.",
    category: "Career",
    difficulty: "Beginner",
    // Items can be a plain [text, options] pair (shared) or { student, professional } variants.
    // Variants must keep the same option order (and, for choice items, the same dimensions).
    audiences: [
      { key: "school", emoji: "🏫", label: "School student", hint: "Class 9–10, choosing a stream" },
      { key: "student", emoji: "🎓", label: "Student", hint: "Class 11–12 or college" },
      { key: "professional", emoji: "💼", label: "Working professional", hint: "Working, or planning a switch" },
    ],
    dimensions: [
      {
        key: "R", name: "Builder (Realistic)",
        high: "You love hands-on work: building, fixing, operating tools or being outdoors.",
        low: "Hands-on, physical or mechanical work isn't what energises you.",
        items: [
          ["Your ceiling fan starts making a strange noise.", ["Call someone. You wouldn't know where to start.", "Look up a repair service.", "Watch a video and maybe try a simple fix.", "Grab a screwdriver. You love figuring out how things work."]],
          ["A friend is building a bookshelf and planting a small garden this weekend, and invites you to help.", ["Politely decline. It's not your thing.", "Go, mostly to hang out.", "Help out and enjoy it.", "Take charge of the tools. This is your idea of a perfect weekend."]],
        ],
      },
      {
        key: "I", name: "Thinker (Investigative)",
        high: "You're driven to understand how things work through research, analysis and solving complex problems.",
        low: "Deep analysis and research feel slow. You prefer action or people over theory.",
        items: [
          ["You see a viral post claiming a new food \"cures\" stress.", ["Share it. Sounds great.", "Scroll past.", "Wonder if it's actually true.", "Look up the original study and check how it was done."]],
          ["Your phone's battery suddenly starts draining fast.", ["Just charge it more often.", "Ask a friend what to do.", "Check which apps are using the most battery.", "Dig through settings and forums until you find the exact cause."]],
        ],
      },
      {
        key: "A", name: "Creator (Artistic)",
        high: "You need room to create and express yourself, through design, words, music or ideas.",
        low: "You prefer clear structure and practical outcomes over open-ended creative work.",
        items: [
          {
            school: ["You're asked to make the poster for your school's annual day.", ["Use a ready-made template as it is.", "Copy a design from the internet and change it a little.", "Design something of your own.", "Lose hours experimenting with layouts, colours and drawings. You love it."]],
            student: ["You're asked to make the poster for your college fest.", ["Use a ready-made template as it is.", "Tweak a template a little.", "Design something of your own.", "Lose hours experimenting with layouts, fonts and colours. You love it."]],
            professional: ["Your team needs a slide deck for a big client pitch.", ["Reuse an old deck as it is.", "Update an old deck a little.", "Design fresh slides of your own.", "Lose hours perfecting the visuals and storytelling. You love it."]],
          },
          ["You have a free evening and a blank notebook.", ["Use it for to-do lists.", "Doodle a little.", "Jot down some ideas or sketches.", "Fill pages with stories, designs or song lyrics."]],
        ],
      },
      {
        key: "S", name: "Helper (Social)",
        high: "You're energised by helping, teaching and supporting people.",
        low: "You'd rather work with things, data or ideas than spend all day supporting others.",
        items: [
          {
            school: ["Before a unit test, a friend is stuck on a chapter you understand well.", ["Leave them to figure it out.", "Send them a good video link.", "Explain it if they ask.", "Sit with them and teach them until it clicks. You enjoy it."]],
            student: ["Before exams, a classmate is struggling with a topic you understand well.", ["Leave them to figure it out.", "Send them a good video link.", "Explain it if they ask.", "Sit with them and teach them until it clicks. You enjoy it."]],
            professional: ["A new joiner on your team is struggling with a tool you know well.", ["Leave them to figure it out.", "Send them the documentation.", "Help them when they ask.", "Offer to mentor them until they're confident. You enjoy it."]],
          },
          ["Your neighbourhood is organising a weekend volunteering drive.", ["Skip it.", "Donate, but don't go.", "Join in for a few hours.", "Offer to coordinate it. Helping people is what you love."]],
        ],
      },
      {
        key: "E", name: "Persuader (Enterprising)",
        high: "You like to lead, persuade, take risks and make things happen.",
        low: "Selling, pitching and leading from the front aren't your favourite things.",
        items: [
          {
            school: ["Students at your school keep complaining about something nobody is fixing, like the water cooler or the sports timetable.", ["Complain too.", "Hope a teacher fixes it.", "Suggest an idea to your class teacher.", "Collect ideas from classmates and present a plan to the principal."]],
            student: ["Students on campus keep complaining about a problem nobody is fixing, like the canteen or the Wi-Fi.", ["Complain too.", "Hope someone fixes it.", "Suggest an idea to the student council.", "Pitch a solution, rally people and launch it yourself."]],
            professional: ["Your team keeps complaining about a broken process nobody is fixing.", ["Complain too.", "Hope management fixes it.", "Suggest an idea to your manager.", "Propose a fix, get buy-in and lead the change yourself."]],
          },
          {
            school: ["Your school is holding a fun fair and every class gets a stall.", ["Just visit the other stalls.", "Help out if someone asks.", "Run the stall for a shift.", "Plan what to sell, set prices and try to make the most profit."]],
            student: ["You're given ₹10,000 and one month to grow it.", ["Keep it safe and do nothing.", "Put it in a savings account.", "Try a small side hustle.", "Start a mini-business and aim to double it."]],
            professional: ["Your company invites employees to pitch ideas for a new internal venture.", ["Ignore it.", "Read about the winning ideas later.", "Help a colleague with their pitch.", "Pitch your own idea and push to lead it."]],
          },
        ],
      },
      {
        key: "C", name: "Organiser (Conventional)",
        high: "You thrive on order, accuracy and well-run systems.",
        low: "Detailed records, routines and procedures can feel tedious to you.",
        items: [
          {
            school: ["Your class is planning a picnic and needs someone to collect money and keep track of it.", ["Stay far away from that job.", "Help only if the teacher asks.", "Make sure you've paid your own share.", "Volunteer and keep a neat list of who's paid and what's been spent."]],
            student: ["Your class trip needs someone to handle the budget and bookings.", ["Stay far away from that job.", "Help only if someone asks.", "Keep track of your own share.", "Volunteer and build a neat spreadsheet everyone can follow."]],
            professional: ["Your team offsite needs someone to handle the budget, vendors and bookings.", ["Stay far away from that job.", "Help only if someone asks.", "Keep track of your own expenses.", "Volunteer and build a neat tracker everyone can follow."]],
          },
          ["Your files, photos and documents are…", ["Everywhere. You search every time.", "Mostly sitting in Downloads.", "Sorted into a few folders.", "Neatly named and organised, with backups."]],
        ],
      },
    ],
    choiceItems: [
      {
        school: ["Your school's annual day needs student volunteers. Which job do you pick?", [["A", "Designing the backdrop and decorations."], ["S", "Guiding parents and looking after the younger kids."], ["E", "Hosting the show on stage."], ["C", "Managing the programme order and backstage timings."]]],
        student: ["Your college fest needs volunteers. Which role do you grab?", [["A", "Designing the posters and stage décor."], ["S", "Running the help desk and looking after guests."], ["E", "Getting sponsors and pitching to local businesses."], ["C", "Managing registrations, budgets and the schedule."]]],
        professional: ["Your company's annual day needs volunteers. Which role do you grab?", [["A", "Designing the theme, invites and stage décor."], ["S", "Welcoming guests and making sure everyone's looked after."], ["E", "Getting sponsors and hosting on stage."], ["C", "Managing the budget, vendors and run-sheet."]]],
      },
      {
        school: ["Your school offers a week-long summer camp. Which workshop do you join?", [["R", "Robotics and building circuits."], ["I", "Science experiments and logic puzzles."], ["E", "Young entrepreneurs: run a pretend business."], ["C", "Money basics: budgeting and saving."]]],
        student: ["You land a summer internship. Which project sounds best?", [["R", "Setting up and testing equipment out in the field."], ["I", "Analysing data to find out why sales dropped."], ["E", "Helping launch a new product and pitch it to clients."], ["C", "Streamlining the company's records and processes."]]],
        professional: ["You can join a three-month side project at work. Which one?", [["R", "Setting up and testing new equipment or infrastructure on site."], ["I", "Analysing data to find out why customers are leaving."], ["E", "Leading the launch of a new product with clients."], ["C", "Redesigning how the company tracks records and approvals."]]],
      },
      ["Which YouTube rabbit hole are you most likely to fall into?", [["R", "DIY builds, car repairs or woodworking."], ["I", "Science explainers and space documentaries."], ["A", "Film-making, art or music production tutorials."], ["S", "Psychology, teaching tips or inspiring stories about people."]]],
      {
        school: ["In a group project at school, you usually end up…", [["I", "Finding the information and checking facts."], ["S", "Making sure everyone gets along and joins in."], ["E", "Leading the group and presenting to the class."], ["C", "Making the plan and keeping track of who does what."]]],
        student: ["In a group assignment, you naturally end up…", [["I", "Doing the research and fact-checking."], ["S", "Keeping everyone motivated and smoothing out clashes."], ["E", "Leading the group and presenting to the class."], ["C", "Making the timeline and tracking who's doing what."]]],
        professional: ["In a cross-team project, you naturally end up…", [["I", "Doing the analysis and fact-checking."], ["S", "Keeping everyone aligned and smoothing out conflicts."], ["E", "Leading meetings and presenting to leadership."], ["C", "Owning the project plan and tracking deliverables."]]],
      },
      ["Pick your ideal workspace.", [["R", "A workshop, a lab bench or outdoors."], ["A", "A colourful studio full of inspiration."], ["S", "A classroom, clinic or community centre."], ["C", "A calm, well-organised office with clear systems."]]],
      {
        student: ["Your summer break is free and you can learn anything. You choose…", [["R", "Electronics, carpentry or flying drones."], ["I", "Coding, data science or astronomy."], ["A", "Photography, writing or graphic design."], ["E", "Public speaking, investing or starting a business."]]],
        professional: ["Your company gives you a learning budget for any course. You pick…", [["R", "A hands-on technical certification, like electrical, robotics or drones."], ["I", "Data science, AI or advanced analytics."], ["A", "UX design, photography or creative writing."], ["E", "Leadership, sales or a business management course."]]],
      },
      ["Which compliment would make you proudest?", [["I", "\"You're brilliant at solving tough problems.\""], ["A", "\"You're so original and creative.\""], ["E", "\"You're a natural leader.\""], ["C", "\"You're incredibly reliable and precise.\""]]],
      ["At a party, you're the one who…", [["R", "Fixes the speaker when it stops working."], ["A", "Sorts out the playlist and decorations."], ["S", "Makes sure the new person feels included."], ["E", "Plans what happens next and gets everyone on board."]]],
      {
        student: ["You can shadow someone at work for a day. You pick…", [["R", "A civil engineer on a construction site."], ["I", "A researcher in a science lab."], ["S", "A school counsellor."], ["C", "A chartered accountant during audit season."]]],
        professional: ["If you could swap roles for a month, you'd try being…", [["R", "A site engineer on a construction or factory project."], ["I", "A researcher or data scientist."], ["S", "A trainer, coach or HR partner."], ["C", "A finance controller or auditor."]]],
      },
      {
        school: ["What frustrates you most at school?", [["I", "Topics that never get properly explained."], ["A", "Being told there's only one right way to do things."], ["S", "Classmates being mean to each other."], ["C", "Messy notes, lost homework and last-minute chaos."]]],
        student: ["What frustrates you most in college?", [["I", "Topics that never get properly explained."], ["A", "Being forced to do things only one way."], ["S", "People treating each other unkindly."], ["C", "Chaos, missed deadlines and messy notes."]]],
        professional: ["What frustrates you most at work?", [["I", "Problems that never get properly understood."], ["A", "Being forced to do things only one way."], ["S", "People treating each other unkindly."], ["C", "Chaos, missed deadlines and messy records."]]],
      },
      ["A local NGO needs your help for a month. You'd rather…", [["R", "Help build and repair their facilities."], ["S", "Teach or mentor the children they support."], ["E", "Run their fundraising campaign."], ["C", "Organise their accounts and donor database."]]],
      ["Which success sounds most satisfying?", [["R", "Building something real with your own hands that lasts for years."], ["I", "Discovering something no one knew before."], ["A", "Creating work that moves people."], ["E", "Growing a company from zero to hundreds of customers."]]],
    ],
    summary: (scores) => {
      const [a, b, c] = [...scores].sort((x, y) => y.pct - x.pct);
      const top = matchCareers(scores).slice(0, 3).map((x) => x.title);
      const second = RIASEC[b.key].desc;
      return {
        title: `The ${RIASEC[a.key].name}–${RIASEC[b.key].name}`,
        text: `${RIASEC[a.key].desc} As a secondary ${RIASEC[b.key].name}, ${second.charAt(0).toLowerCase() + second.slice(1)}`,
        score: a.key + b.key + c.key,
        share: `Top career matches: ${top.join(", ")}.`,
      };
    },
    extraResults: (scores, audience) => {
      const ranked = matchCareers(scores);
      const route = {
        school: (c) => `<b>📚 Stream after Class 10:</b> ${STREAMS[c.stream]}. ${c.school}`,
        student: (c) => `<b>🎓 How to get there:</b> ${c.student}`,
        professional: (c) => `<b>🔁 How to switch:</b> ${c.pro}`,
      }[audience];
      const card = (c) => `
        <div class="career">
          <div class="career-head"><strong>${c.title}</strong><span class="pill">${c.code}</span></div>
          <p>${c.desc}</p>
          ${route ? `<p class="career-path">${route(c)}</p>` : ""}
        </div>`;
      const nextSteps = {
        school: ["Your next steps", "Talk to your parents and a school counsellor about the stream above, join a club or try a short online course in your top career area, and retake this test next year as your interests grow."],
        student: ["Your next steps", "Shortlist 2–3 careers, look up the entrance exams and courses, talk to someone working in each role, and try a short internship or online course before you decide."],
        professional: ["Your switch plan", "Pick one career to explore, list the skills that transfer from your current role, start with a small course or side project, and talk to 2–3 people who've made the same switch."],
      }[audience];
      const streams = audience === "school" ? recommendStreams(ranked) : [];
      return `
        ${streams.length ? `
        <div class="stream-pick">
          <div class="eyebrow">Best-fit stream for you</div>
          <div class="stream-main">${streams[0]}</div>
          ${streams[1] ? `<p>Also a good fit: <strong>${streams[1]}</strong>. Pick the one whose subjects you enjoy most, since you'll study them for two years.</p>` : ""}
        </div>` : ""}
        <h2 class="section-title">🎯 Your top career matches</h2>
        <div class="career-grid">${ranked.slice(0, 3).map(card).join("")}</div>
        <h2 class="section-title">Also worth exploring</h2>
        <div class="career-grid">${ranked.slice(3, 9).map(card).join("")}</div>
        ${nextSteps ? `<div class="next-steps"><strong>${nextSteps[0]}</strong><p>${nextSteps[1]}</p></div>` : ""}
        <p class="note" style="text-align:left">Each career's code shows the three interest types it suits most. These are starting points to research, not limits.</p>`;
    },
    scoreLabel: "Your career code",
    scoreSuffix: "",
  },
  {
    id: "big-five",
    emoji: "🧭",
    title: "Big 5 (OCEAN) Test",
    description:
      "Map your personality across the five universal traits: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
    category: "Personality",
    difficulty: "Intermediate",
    dimensions: [
      {
        key: "O", name: "Openness",
        high: "You're imaginative, curious and drawn to ideas, art and new experiences.",
        low: "You prefer the concrete and familiar, and value practicality over abstraction.",
        items: [
          ["A friend invites you to a restaurant serving a cuisine you've never tried, and you can't read the menu.", ["Suggest going to your usual place instead.", "Go, but order the dish that sounds most familiar.", "Ask the waiter for a recommendation and give it a go.", "Order the strangest thing on the menu. That's half the fun."]],
          ["You have a free Sunday afternoon with nothing planned.", ["Catch up on chores and a familiar TV show.", "Watch the new film everyone's talking about.", "Visit a museum or gallery you've never been to.", "Start learning something completely new, like a language, instrument or craft."]],
          ["In a meeting, someone proposes a radical new way of doing a task your team has done the same way for years.", ["Push back. The current way works fine.", "Wait to see if it's been proven elsewhere first.", "Ask questions to understand how it would work.", "Get excited and start building on the idea."]],
          ["You come across a long article on an abstract topic, like the philosophy of time.", ["Skip it. It's not useful in real life.", "Read the headline and move on.", "Save it to read later if you have time.", "Read it right away and lose an hour going down the rabbit hole."]],
        ],
      },
      {
        key: "C", name: "Conscientiousness",
        high: "You're organised, dependable and plan ahead. People can count on you.",
        low: "You're flexible and spontaneous, though structure and follow-through may take effort.",
        items: [
          ["You have a big assignment due in two weeks.", ["Start the night before. Pressure helps you focus.", "Start a few days before and rush the end.", "Chip away at it and finish just in time.", "Make a plan on day one and finish early."]],
          ["You get home after a long day and your room is a mess.", ["Leave it. It'll get done eventually.", "Push things aside to make some space.", "Do a quick tidy before bed.", "Put everything back in its place. You can't relax otherwise."]],
          ["A coworker asks you to check a report before it goes to a client.", ["Glance at it and say it looks good.", "Read it once and fix any obvious typos.", "Read it carefully and flag any issues.", "Check every number against the source and send back detailed notes."]],
          ["You promised to help a friend move on Saturday, but now you'd rather rest.", ["Cancel with a vague excuse.", "Go, but turn up late and leave early.", "Go, although you're grumbling inside.", "Show up on time with boxes and tape. You gave your word."]],
        ],
      },
      {
        key: "E", name: "Extraversion",
        high: "You gain energy from people, enjoy the spotlight and speak up easily.",
        low: "You recharge alone, prefer smaller groups and think before you speak.",
        items: [
          ["You arrive at a party where you only know the host.", ["Find a quiet corner, or leave early.", "Stick close to the host all night.", "Chat with whoever comes up to you.", "Introduce yourself to a group, and soon you're telling stories."]],
          ["After a draining week, your ideal Friday night is…", ["Completely alone with a book or game.", "A quiet dinner with one close friend.", "A small get-together with a few friends.", "A big night out. People recharge you."]],
          ["Your manager asks for a volunteer to present the team's work to senior leadership.", ["Avoid eye contact and hope someone else volunteers.", "Offer to make the slides as long as someone else presents.", "Agree if nobody else steps up.", "Raise your hand straight away. You enjoy the spotlight."]],
          ["You're in a long queue and the person next to you looks friendly.", ["Put your headphones in.", "Smile, but don't start a conversation.", "Reply warmly if they start chatting.", "Strike up a conversation. You might even swap numbers."]],
        ],
      },
      {
        key: "A", name: "Agreeableness",
        high: "You're warm, cooperative and attentive to other people's needs.",
        low: "You're direct and competitive, and more sceptical of others' motives.",
        items: [
          ["A friend asks for help with a problem while you're already busy.", ["Tell them you can't. It's not your problem.", "Give some quick advice and get back to your work.", "Set aside time later to help properly.", "Drop what you're doing and help them now."]],
          ["In a group discussion, someone states an opinion you think is wrong.", ["Tell them bluntly that they're wrong.", "Debate until they back down.", "Share your view, but acknowledge theirs.", "Look for common ground so everyone feels heard."]],
          ["A stranger asks you for directions while you're in a hurry.", ["Ignore them and keep walking.", "Point vaguely and keep moving.", "Stop and give clear directions.", "Walk part of the way with them to make sure they find it."]],
          ["Your flatmate forgot to do their share of the chores again.", ["Leave an angry note.", "Point it out sharply next time you see them.", "Mention it calmly and agree on a plan.", "Ask if everything's okay. Maybe they've had a rough week."]],
        ],
      },
      {
        key: "N", name: "Neuroticism",
        high: "You feel emotions intensely and are more prone to stress and worry.",
        low: "You're emotionally steady, calm under pressure and slow to get upset.",
        items: [
          ["You send your manager a message and they don't reply all day.", ["You don't even notice.", "You assume they're busy.", "You wonder a few times if you said something wrong.", "You reread the message over and over, sure you're in trouble."]],
          ["Your holiday plans get cancelled at the last minute.", ["Shrug and make new plans.", "Feel a bit disappointed, then move on.", "Feel down for the rest of the day.", "Feel crushed and stay upset for days."]],
          ["It's the night before a big exam or interview.", ["You sleep soundly.", "You feel some nerves, but sleep fine.", "You toss and turn for a while.", "You barely sleep, imagining everything that could go wrong."]],
          ["Someone makes a mildly critical comment about your outfit.", ["Laugh it off. You like it.", "Notice it, but forget it soon after.", "Feel self-conscious for the rest of the day.", "Go home and change. The comment stays with you for weeks."]],
        ],
      },
    ],
    summary: byTop({
      O: { title: "The Explorer", text: "Openness is your strongest trait. You're driven by curiosity and new ideas, and you're happiest when you're learning or creating." },
      C: { title: "The Architect", text: "Conscientiousness leads your profile. You bring order, reliability and follow-through to everything you take on." },
      E: { title: "The Spark", text: "Extraversion stands out. You energise rooms, build connections quickly and thrive on shared experiences." },
      A: { title: "The Harmoniser", text: "Agreeableness is your strongest trait. You're the glue in your groups: kind, trusting and quick to help." },
      N: { title: "The Sensitive Soul", text: "Your emotions run deep. You notice what others miss, but stress can hit you harder, so self-care matters." },
    }),
  },
  {
    id: "emotional-rollercoaster",
    emoji: "🎢",
    title: "The Emotional Rollercoaster Test",
    description:
      "Gain clarity on emotional regulation patterns and how they impact your self-image and relationships.",
    category: "Emotions",
    difficulty: "Intermediate",
    dimensions: [
      {
        key: "aw", name: "Emotional Awareness",
        high: "You recognise and name your feelings early, which gives you more choice in how you respond.",
        low: "Feelings can arrive unannounced. Pausing to name what you feel can help a lot.",
        items: [
          ["You snap at a family member over something small. Later, you…", ["Figure they were just being annoying.", "Know you were in a bad mood, but not why.", "Realise you were tired and stressed from work.", "Trace it back: you've been anxious about a deadline all week and it spilled over."]],
          ["Your stomach knots up before a difficult conversation.", ["You don't notice until it's over.", "You feel \"off\" but can't say why.", "You recognise that you're nervous.", "You recognise you're nervous and know exactly which part you're dreading."]],
          ["A close friend asks, \"How are you really feeling?\"", ["You say \"fine\". You honestly don't know.", "You say \"stressed\", but struggle to say more.", "You name a couple of feelings.", "You describe your mix of emotions and what's driving each one."]],
          ["You've felt irritable all afternoon.", ["It must be other people's fault.", "You push through without thinking about it.", "You wonder whether you're just hungry or tired.", "You check in with yourself: food, sleep, or something someone said?"]],
        ],
      },
      {
        key: "st", name: "Stability",
        high: "Your mood stays fairly even. Setbacks rarely knock you off course.",
        low: "Your mood swings quickly with events and other people's energy.",
        items: [
          ["Your morning starts with spilled coffee and a missed bus.", ["The whole day feels ruined.", "You're grumpy until lunch.", "You're annoyed for a bit, then it passes.", "You laugh it off. Some mornings are like that."]],
          ["A friend arrives in a terrible mood.", ["Within minutes, you're in a terrible mood too.", "Their mood gets to you after a while.", "You feel for them but stay mostly steady.", "You stay calm, and your steadiness helps them settle."]],
          ["During a heated discussion, someone says something that really annoys you.", ["You explode and say things you regret.", "You raise your voice.", "You feel the heat but keep your tone in check.", "You notice the anger, take a breath and respond calmly."]],
          ["Dinner plans are moved at the last minute to a place you don't like.", ["You're genuinely upset and might skip it.", "You complain about it all evening.", "You're mildly put out but go along.", "You adapt easily. The company matters more."]],
        ],
      },
      {
        key: "rc", name: "Recovery",
        high: "You bounce back well and have reliable ways to soothe yourself.",
        low: "Upsetting moments linger. Building a go-to calming routine could shorten the dips.",
        items: [
          ["You argued with someone close this morning. By the evening…", ["You're still fuming and replaying it.", "You're calmer, but still stewing.", "You've cooled off and want to talk.", "You've reflected, calmed down and know what you want to say."]],
          ["You make an embarrassing mistake at work.", ["You think about it for weeks.", "It bothers you for days.", "It stings for an evening.", "You fix it, learn from it and move on within hours."]],
          ["You're feeling low for no clear reason.", ["You sink further, and it lasts for days.", "You wait it out and hope it passes.", "You distract yourself, and it usually lifts.", "You turn to something that reliably helps, like a walk, music or calling someone."]],
          ["You've just had upsetting news, but you need to get back to work.", ["Impossible. The rest of the day is lost.", "You try, but can't concentrate.", "It takes an hour or two to refocus.", "You take a short break, then get back on track."]],
        ],
      },
      {
        key: "ex", name: "Healthy Expression",
        high: "You share feelings openly and respectfully, and you ask for support when needed.",
        low: "You tend to bottle things up, which can lead to pressure building over time.",
        items: [
          ["A friend keeps cancelling plans, and it hurts.", ["Say nothing and quietly pull away.", "Drop passive-aggressive hints.", "Mention it casually, as a joke.", "Tell them honestly that it hurts and ask what's going on."]],
          ["You're struggling, but everyone around you seems fine.", ["Hide it completely.", "Hint at it, but don't ask for anything.", "Tell one person if they ask.", "Reach out to someone you trust and ask for support."]],
          ["You disagree with a decision your group just made.", ["Go along with it and resent it later.", "Complain about it to others afterwards.", "Raise it, but get defensive.", "Explain your view clearly and respectfully."]],
          ["Something sad happens and you feel like crying in front of people you trust.", ["Hold it in at all costs.", "Excuse yourself and cry alone.", "Let a little show, then apologise for it.", "Let yourself cry. It's okay to be human."]],
        ],
      },
      {
        key: "si", name: "Self-Image Resilience",
        high: "Your sense of worth holds steady even on hard days.",
        low: "Difficult emotions tend to spill into how you see yourself. Self-compassion is a skill worth practising.",
        items: [
          ["Your manager gives you one piece of criticism among lots of praise.", ["The criticism is all you can think about. Maybe you're bad at your job.", "The praise fades and the criticism lingers.", "It stings, but you take both on board.", "You take the useful part and still feel good about your work."]],
          ["You make a mistake that causes a friend some trouble.", ["You think, \"I'm a terrible person.\"", "You feel guilty and keep apologising.", "You apologise and feel bad for a while.", "You apologise, make it right and remind yourself that everyone makes mistakes."]],
          ["It's been one of those days where nothing went right.", ["You feel worthless.", "You question whether you're good at anything.", "You're frustrated, but tomorrow's a new day.", "You're kind to yourself. A bad day doesn't define you."]],
          ["You're anxious and a friend notices.", ["You worry they'll think less of you now.", "You quickly brush it off so they don't see.", "You admit it, but feel a bit exposed.", "You share it. Your feelings are valid and they care."]],
        ],
      },
    ],
    summary: byOverall([
      { min: 67, title: "The Steady Navigator", text: "You ride emotional waves with skill. You notice what you feel, recover well and protect your self-worth along the way." },
      { min: 40, title: "The Wave Rider", text: "You handle many ups and downs well, but some situations still throw you. Your lowest areas below show where small habits would make the biggest difference." },
      { min: 0, title: "The Storm Chaser", text: "Your emotions often take the wheel, and that can be exhausting. The good news: regulation is learnable. Start with naming feelings and building one reliable calming routine." },
    ]),
  },
  {
    id: "self-focus",
    emoji: "🪞",
    title: "Self-Focus Test",
    description:
      "Ever wondered where you fall on the spectrum of self-confidence and ego? This assessment helps you spot narcissistic traits and behavioural patterns in a private, supportive way.",
    category: "Personality",
    difficulty: "Intermediate",
    dimensions: [
      {
        key: "cf", name: "Healthy Confidence",
        high: "You trust yourself without needing to be better than others.",
        low: "Self-doubt shows up often. Your worth may feel shakier than it should.",
        items: [
          ["You're offered a project slightly beyond your current skills.", ["Turn it down. You'd probably fail.", "Accept, but worry constantly.", "Accept and ask for some guidance.", "Accept confidently. You'll learn as you go."]],
          ["A colleague is clearly better than you at something you care about.", ["You feel inadequate.", "You downplay their skill.", "You admire them, a little reluctantly.", "You admire them openly and ask what you can learn."]],
          ["Something you posted online gets very few likes.", ["Delete it, embarrassed.", "Keep checking it and feel worse each time.", "Feel a twinge of disappointment, then forget it.", "Don't mind. You posted it because you liked it."]],
          ["You face an important decision and the advice you're getting is split.", ["Go with whatever most people say.", "Keep asking for more opinions.", "Weigh the advice, then decide.", "Listen, then trust your own judgment."]],
        ],
      },
      {
        key: "ad", name: "Admiration Seeking",
        high: "Recognition matters a lot to you, and you enjoy being noticed and admired.",
        low: "You don't need the spotlight and you share credit easily.",
        items: [
          ["At dinner, the conversation drifts away from a story you were telling.", ["Happily move on to the new topic.", "Feel slightly cut off, but let it go.", "Wait for a chance to finish your story.", "Bring it straight back to you. It was the best story."]],
          ["Your team wins an award for a project you contributed a lot to.", ["Make sure everyone on the team gets credit.", "Mention your part if someone asks.", "Make sure your boss knows how much you did.", "Post about it, hinting that you made it happen."]],
          ["You're getting ready for an event where friends will post lots of photos.", ["You barely think about it.", "You make sure you look decent.", "You spend extra time getting ready.", "You plan your look for the photos and retake shots until they're perfect."]],
          ["Someone else gets lots of praise at a party.", ["Join in praising them.", "Feel neutral about it.", "Feel a bit overlooked.", "Find a way to steer the attention back to you."]],
        ],
      },
      {
        key: "en", name: "Entitlement",
        high: "You often feel you deserve more or different treatment than others.",
        low: "You see yourself as on equal footing with the people around you.",
        items: [
          ["The restaurant says there's a 30-minute wait for a table.", ["Wait like everyone else.", "Wait, but feel impatient.", "Ask if they can make an exception for you.", "Insist that someone like you shouldn't have to wait."]],
          ["Your office introduces a new rule you find pointless.", ["Follow it like everyone else.", "Follow it, grumbling.", "Follow it only when someone's watching.", "Ignore it. Rules like that aren't meant for you."]],
          ["A friend can't do you a favour this time.", ["You completely understand.", "You feel slightly let down.", "You remind them of all the favours you've done for them.", "You're offended. After everything, they owe you."]],
          ["You're put on a team where everyone's role is equal.", ["Happy to be one of the team.", "Fine with it, though you'd prefer to lead.", "You expect your opinions to carry extra weight.", "You feel you deserve a special role or title."]],
        ],
      },
      {
        key: "em", name: "Empathy",
        high: "You're tuned in to others and genuinely care about their wellbeing.",
        low: "Other people's feelings may not register strongly, or may feel like a distraction.",
        items: [
          ["A coworker has been much quieter than usual.", ["You don't notice.", "You notice, but it's not your business.", "You ask if they're okay.", "You check in privately and offer to help."]],
          ["A friend tells you about a problem that seems small to you.", ["Tell them it's not a big deal.", "Listen briefly, then turn the conversation to your own news.", "Listen and offer advice.", "Listen carefully and acknowledge how it feels for them."]],
          ["Someone you don't particularly like gets great news.", ["You feel annoyed.", "You feel indifferent.", "You congratulate them politely.", "You feel genuinely glad for them."]],
          ["You could get ahead at work by exploiting a colleague's mistake.", ["Use it. That's business.", "Use it, though you feel a bit bad.", "Let it pass.", "Quietly help them fix it."]],
        ],
      },
      {
        key: "cs", name: "Criticism Sensitivity",
        high: "Criticism and being outshone hit hard, and you may react defensively.",
        low: "You can take feedback calmly and use it to grow.",
        items: [
          ["Your manager says your work \"needs improvement\".", ["Ask for specifics and work on it.", "Feel disappointed, but take it on board.", "Feel attacked and get defensive.", "Feel humiliated and start listing their flaws."]],
          ["Someone jokes about a mistake you made, in front of others.", ["Laugh along.", "Feel a bit embarrassed.", "Feel humiliated, but hide it.", "Fire back with a cutting remark."]],
          ["A friend gets the promotion you wanted.", ["You're happy for them.", "You're a bit envious, but congratulate them.", "You feel threatened and avoid them for a while.", "You tell others why they don't deserve it."]],
          ["Something you made gets a mixed review online.", ["Read it for useful points.", "Feel a little hurt.", "Keep rereading it and feel worse.", "Reply angrily or get friends to report it."]],
        ],
      },
    ],
    summary: byOverall(
      [
        { min: 60, title: "Elevated Self-Focus", text: "Several narcissistic patterns show up strongly: a need for admiration, entitlement, or defensiveness. This isn't a diagnosis, but it may be worth reflecting on how these patterns affect your relationships." },
        { min: 35, title: "Balanced Self-Focus", text: "You have a healthy level of ego with a few self-focused tendencies, which is normal for most people. Check the higher areas below to see what tips you into self-focus." },
        { min: 0, title: "Grounded & Other-Aware", text: "You show few narcissistic traits. You're attentive to others and don't depend on admiration to feel okay." },
      ],
      (s) => (pick(s, "ad") + pick(s, "en") + pick(s, "cs") + (100 - pick(s, "em"))) / 4
    ),
    scoreLabel: "Self-focus index",
  },
  {
    id: "eq",
    emoji: "💡",
    title: "EQ Test",
    description:
      "Measures your ability to manage emotions and social dynamics, giving you a clear score and an archetype to help you improve your relationships and career.",
    category: "Emotions",
    difficulty: "Intermediate",
    dimensions: [
      {
        key: "sa", name: "Self-Awareness",
        high: "You understand your emotions, strengths and blind spots.",
        low: "Your inner world may be harder to read. Reflection and feedback can sharpen it.",
        items: [
          ["After a frustrating meeting, a colleague says you seemed tense.", ["You're surprised. You thought you were fine.", "You realise they might be right.", "You agree. You knew you were frustrated.", "You agree and can explain exactly what frustrated you and why."]],
          ["In an interview, you're asked to name your biggest weakness.", ["You freeze. You've never thought about it.", "You give a cliché like \"I'm a perfectionist\".", "You name a real weakness.", "You name a real weakness, with an example and how you're working on it."]],
          ["Looking back, you've been short with people all week.", ["You hadn't noticed.", "You notice, but don't think about why.", "You wonder what's going on with you.", "You pinpoint the cause and deal with it."]],
          ["You're facing a big life decision.", ["You go with your gut without thinking it through.", "You make a quick list of pros and cons.", "You consider how you feel about each option.", "You reflect on your values and why each option pulls at you."]],
        ],
      },
      {
        key: "sr", name: "Self-Regulation",
        high: "You stay composed under pressure and think before you act.",
        low: "Impulses and temper can get ahead of you at times.",
        items: [
          ["A customer or client is rude to you.", ["Snap back.", "Get visibly irritated.", "Stay polite, then vent afterwards.", "Stay calm and professional and steer things forward."]],
          ["Your project plan falls apart a week before the deadline.", ["Panic.", "Get stressed and blame others.", "Feel stressed, then make a new plan.", "Take a breath, re-prioritise and calmly guide the team."]],
          ["You're saving money and see something tempting on sale.", ["Buy it immediately.", "Buy it, then regret it.", "Hesitate, then usually resist.", "Resist easily. The goal matters more."]],
          ["You receive an email that makes you angry.", ["Fire off an angry reply.", "Reply curtly.", "Wait a while before replying.", "Draft a reply, sleep on it and send a measured response."]],
        ],
      },
      {
        key: "mo", name: "Motivation",
        high: "You're driven from within and resilient through setbacks.",
        low: "Momentum depends on outside pressure. Connecting tasks to personal meaning can help.",
        items: [
          ["You fail at something you worked hard on.", ["Give up on it.", "Lose motivation for a while.", "Try again after a break.", "Work out what went wrong and go again with a better plan."]],
          ["Nobody is checking your progress on a personal goal.", ["You drop it.", "You make occasional progress.", "You keep going, but slowly.", "You keep going steadily. You do it for yourself."]],
          ["Your team is discouraged after a setback.", ["You feel discouraged too.", "You keep your head down.", "You try to stay positive yourself.", "You rally everyone around the next step."]],
          ["Things are going well at work.", ["You coast.", "You keep doing what you're doing.", "You look for small improvements.", "You set yourself a new challenge."]],
        ],
      },
      {
        key: "em", name: "Empathy",
        high: "You read people well and make them feel understood.",
        low: "Others' feelings can be hard to read. Active listening is a great place to start.",
        items: [
          ["A friend says \"I'm fine\", but their voice sounds flat.", ["Take them at their word.", "Sense something, but move on.", "Ask if they're sure.", "Gently say they seem down and make space for them to talk."]],
          ["A colleague is telling you about a problem while you're busy.", ["Keep typing and nod.", "Half-listen while thinking about your reply.", "Stop and listen.", "Stop, listen fully and reflect back what you heard."]],
          ["Someone gets upset over something you think is trivial.", ["Tell them they're overreacting.", "Feel confused and change the subject.", "Try to understand why it matters to them.", "Ask questions until you understand, and acknowledge their feelings."]],
          ["You're making a decision that affects your team.", ["Decide based only on results.", "Consider others only if they complain.", "Think about how it will affect people.", "Ask the people affected before deciding."]],
        ],
      },
      {
        key: "so", name: "Social Skills",
        high: "You build rapport, handle conflict and influence people with ease.",
        low: "Difficult conversations and teamwork may feel draining or awkward.",
        items: [
          ["Two teammates are in a tense disagreement.", ["Stay out of it.", "Side with the one you like more.", "Suggest they talk it out.", "Help them find common ground."]],
          ["You need to tell a colleague their work isn't good enough.", ["Avoid it and fix it yourself.", "Be blunt and get it over with.", "Tell them gently, but vaguely.", "Give specific, kind feedback and offer to help."]],
          ["You join a new team where you don't know anyone.", ["Keep to yourself.", "Wait for others to approach you.", "Introduce yourself to a few people.", "Quickly build friendly relationships across the team."]],
          ["You want your group to adopt your idea.", ["Drop it if anyone objects.", "Push hard until they give in.", "Explain the benefits.", "Listen to concerns and shape the idea so everyone's on board."]],
        ],
      },
    ],
    summary: (scores) => {
      const top = [...scores].sort((a, b) => b.pct - a.pct)[0];
      const archetypes = {
        sa: { title: "The Reflector", text: "Your greatest EQ strength is self-awareness. You know yourself well, which is the foundation every other emotional skill is built on." },
        sr: { title: "The Anchor", text: "Your greatest strength is self-regulation. You stay steady when others don't, and people trust you in a crisis." },
        mo: { title: "The Driver", text: "Your greatest strength is inner motivation. You keep going after setbacks and lift others with your optimism." },
        em: { title: "The Empath", text: "Your greatest strength is empathy. People feel seen and understood around you." },
        so: { title: "The Connector", text: "Your greatest strength is social skill. You bring people together and navigate conflict gracefully." },
      };
      const avg = scores.reduce((s, d) => s + d.pct, 0) / scores.length;
      return { ...archetypes[top.key], score: Math.round(avg) };
    },
    scoreLabel: "EQ score",
  },
  {
    id: "mental-age",
    emoji: "⏳",
    title: "Mental Age Test",
    description:
      "Discover your core character traits and how they influence your daily behaviour and social interactions, and find out how old you are at heart.",
    category: "Fun",
    difficulty: "Beginner",
    dimensions: [
      {
        key: "re", name: "Responsibility",
        high: "You plan ahead, own your mistakes and handle obligations reliably.",
        low: "You live more in the moment and deadlines can sneak up on you.",
        items: [
          ["A bill is due next week.", ["You forget until you get a reminder.", "You pay it on the last day.", "You pay it a few days early.", "It's on autopay and already in your budget."]],
          ["You accidentally break something at a friend's house.", ["Hope no one notices.", "Mention it awkwardly later.", "Apologise straight away.", "Apologise and insist on replacing it."]],
          ["You get an unexpected bonus.", ["Spend it all this weekend.", "Treat yourself, then save what's left.", "Save most of it.", "Put it toward long-term goals or investments."]],
          ["Your weekly food shopping looks like…", ["There isn't any. You grab whatever, whenever.", "A rushed trip when the fridge is empty.", "A list made the day before.", "Meals planned for the week, with a list to match."]],
        ],
      },
      {
        key: "pa", name: "Patience",
        high: "You can wait, delay gratification and give people grace.",
        low: "You want results now, and waiting tests you.",
        items: [
          ["A phone you want has just come out, but the price will drop in three months.", ["Buy it on launch day.", "Buy it within a couple of weeks.", "Wait a month or so.", "Wait for the price drop, or keep your current one."]],
          ["Your food is taking a long time at a restaurant.", ["Complain loudly.", "Keep checking the time.", "Mention it politely to the staff.", "Relax and enjoy the conversation."]],
          ["A friend keeps making the same mistake.", ["Lose your patience with them.", "Get visibly frustrated.", "Remind them again.", "Calmly help them, however many times it takes."]],
          ["Learning a new skill is taking longer than you expected.", ["Quit.", "Switch to something easier.", "Push through, with some frustration.", "Accept that mastery takes time."]],
        ],
      },
      {
        key: "pe", name: "Perspective",
        high: "You see the bigger picture and don't sweat the small stuff.",
        low: "You're tuned in to what's happening right now and what's new.",
        items: [
          ["Two friends argue, and both want you on their side.", ["Pick the friend you like more.", "Side with whoever's loudest.", "Try to stay neutral.", "Help each of them see the other's point of view."]],
          ["Something that embarrassed you years ago comes up in conversation.", ["You still feel mortified.", "You cringe a bit.", "You find it mildly funny.", "You laugh. It's tiny in the grand scheme of things."]],
          ["A new trend is suddenly everywhere online.", ["Jump in immediately.", "Try it once everyone's doing it.", "Watch with mild interest.", "Ignore it. Trends come and go."]],
          ["Your ideal Saturday night is…", ["Clubbing until sunrise.", "A big party.", "Dinner with friends.", "A good book, a cup of tea and an early night."]],
        ],
      },
      {
        key: "pl", name: "Playfulness",
        high: "You've kept a strong sense of fun and wonder.",
        low: "You lean serious, and silliness isn't really your thing.",
        items: [
          ["It snows for the first time this year.", ["Groan about the commute.", "Admire it from the window.", "Take a walk in it.", "Run outside to build a snowman or start a snowball fight."]],
          ["A friend suggests a board game night.", ["Pass. Games are for kids.", "Go, but mostly watch.", "Play and have fun.", "Get competitive, invent house rules and demand a rematch."]],
          ["Someone tells a really silly pun.", ["Roll your eyes.", "Crack a small smile.", "Laugh.", "Laugh, then reply with an even worse one."]],
          ["You have a boring task to get through.", ["Just do it.", "Put on some background music.", "Promise yourself a reward afterwards.", "Turn it into a game or a race against the clock."]],
        ],
      },
      {
        key: "sp", name: "Spontaneity",
        high: "You say yes to adventure and love a surprise.",
        low: "You like routine, predictability and a good night's sleep.",
        items: [
          ["A friend texts: \"Road trip tomorrow, are you in?\"", ["No. You need more notice.", "Maybe, if you can rearrange things.", "Probably yes.", "You're already packing."]],
          ["How do you plan a holiday?", ["Every day is planned in advance.", "A loose plan with a few must-dos.", "You plan day by day.", "No plan. You go wherever the day takes you."]],
          ["It's 11 pm on a work night and friends invite you out.", ["You're already asleep.", "Decline and go to bed.", "Go for one drink.", "Go, and stay out late."]],
          ["You're offered the chance to go skydiving.", ["Absolutely not.", "Maybe someday.", "You consider it seriously.", "You sign up on the spot."]],
        ],
      },
    ],
    summary: (scores) => {
      const maturity = (pick(scores, "re") + pick(scores, "pa") + pick(scores, "pe")) / 3;
      const youth = (pick(scores, "pl") + pick(scores, "sp")) / 2;
      const age = Math.round(Math.max(12, Math.min(70, 20 + 0.45 * maturity - 0.15 * youth)));
      const bands = [
        { min: 45, title: "Wise Old Soul", text: "You're calm, patient and see the long game. Friends come to you for perspective." },
        { min: 30, title: "Grounded Adult", text: "You balance responsibility with enjoyment. You get things done but still know how to have fun." },
        { min: 20, title: "Curious Explorer", text: "You're figuring things out with energy and openness, and adventure still wins over routine most days." },
        { min: 0, title: "Young at Heart", text: "Playful, spontaneous and full of energy, you live in the moment and keep life fun." },
      ];
      return { ...bands.find((b) => age >= b.min), score: age };
    },
    scoreLabel: "Mental age",
    scoreSuffix: "",
  },
  {
    id: "attachment-style",
    emoji: "💞",
    title: "Attachment Style Test",
    description:
      "Understand how you bond with partners, friends and family. Find out whether your style is secure, anxious, avoidant or fearful.",
    category: "Relationships",
    difficulty: "Beginner",
    dimensions: [
      {
        key: "se", name: "Security",
        high: "You're comfortable with closeness and independence alike.",
        low: "Relationships may feel less safe or predictable for you.",
        items: [
          ["Your partner or best friend wants a weekend away with other friends.", ["You feel hurt and left out.", "You feel uneasy, but say it's fine.", "You feel mostly fine.", "You encourage them to go and have fun."]],
          ["You and someone close have a big argument.", ["You fear the relationship is over.", "You withdraw and wait for them to come to you.", "You're shaken, but reach out after a while.", "You trust you'll work it out, and talk once you're both calm."]],
          ["You need emotional support.", ["You handle it alone. People let you down.", "You hint at it, hoping someone notices.", "You ask, but it feels awkward.", "You comfortably ask someone you trust."]],
          ["Someone close tells you they love you.", ["You doubt they mean it.", "You feel uncomfortable.", "You feel happy, but a little unsure.", "You feel warm and believe them."]],
          ["You're single, or living apart from close friends, for a while.", ["You feel lost and incomplete.", "You feel lonely most of the time.", "You're okay, if a little lonely.", "You feel content. You enjoy your own company and your connections."]],
          ["Someone close needs to lean on you during a tough time.", ["You feel overwhelmed and want space.", "You help, but feel burdened.", "You help willingly.", "You're glad to be there for them."]],
          ["One of your needs isn't being met in a relationship.", ["You never bring it up.", "You bring it up indirectly.", "You bring it up, but nervously.", "You bring it up openly and expect to be heard."]],
        ],
      },
      {
        key: "an", name: "Anxiety",
        high: "You crave closeness and reassurance, and fear of rejection runs high.",
        low: "You rarely worry about losing the people you care about.",
        items: [
          ["You text someone close and they haven't replied after five hours.", ["You don't notice.", "You assume they're busy.", "You check your phone a few times.", "You worry they're upset with you and send follow-ups."]],
          ["Your partner or friend seems a little distant today.", ["You assume they're tired.", "You ask if they're okay.", "You wonder if you did something wrong.", "You feel panicky and need reassurance right away."]],
          ["You see your close friend hanging out with a new group.", ["You're happy for them.", "You're curious.", "You feel a little left out.", "You fear you're being replaced."]],
          ["Someone you've just started dating cancels a date.", ["Reschedule, no problem.", "Feel a bit disappointed.", "Wonder if they're losing interest.", "Feel rejected and replay everything you said."]],
          ["Someone close says, \"We need to talk.\"", ["You stay calm and wait to hear what it is.", "You're a bit curious.", "You're nervous until you talk.", "You feel dread and assume the worst."]],
          ["After a great evening with someone, you…", ["Feel content.", "Look forward to the next time.", "Wonder if they enjoyed it as much as you did.", "Look for reassurance that they still like you."]],
          ["In relationships, you often feel that you…", ["Have a healthy balance.", "Sometimes want a bit more closeness.", "Care more than the other person does.", "Are \"too much\" and need constant reassurance."]],
        ],
      },
      {
        key: "av", name: "Avoidance",
        high: "You protect your independence and may keep people at arm's length.",
        low: "You welcome closeness and let people in.",
        items: [
          ["Someone you're dating wants to define the relationship.", ["You feel excited.", "You feel happy, but need time to think.", "You feel pressured.", "You feel trapped and start pulling away."]],
          ["A friend shares something very personal and clearly hopes you'll open up too.", ["You share openly.", "You share something small.", "You change the subject.", "You feel uncomfortable and keep it surface-level."]],
          ["You're going through a hard time.", ["You lean on the people you love.", "You tell one close friend.", "You mostly handle it alone.", "You handle it completely alone. No one needs to know."]],
          ["Your partner wants to spend every weekend together.", ["You love it.", "You enjoy it, but want some time to yourself too.", "You feel crowded.", "You feel smothered and start making excuses."]],
          ["A relationship hits a rough patch.", ["You work through it together.", "You talk it out, reluctantly.", "You withdraw emotionally.", "You end it. That's easier than dealing with it."]],
          ["Someone tells you how much you mean to them.", ["You say it back sincerely.", "You feel touched, but awkward.", "You deflect with a joke.", "You feel uneasy and downplay it."]],
        ],
      },
    ],
    summary: (scores) => {
      const an = pick(scores, "an"), av = pick(scores, "av"), se = pick(scores, "se");
      if (an >= 55 && av >= 55)
        return { title: "Fearful-Avoidant", text: "You want closeness but also fear it, so you may swing between reaching out and pulling away. Naming this push-pull is the first step to feeling safer in relationships." };
      if (se >= an && se >= av)
        return { title: "Secure", text: "You're comfortable with intimacy and independence. You trust others, communicate needs openly and handle conflict without panic." };
      if (an >= av)
        return { title: "Anxious", text: "You value connection deeply and are highly tuned in to signs of distance. Learning to self-soothe and ask directly for reassurance can ease the worry." };
      return { title: "Dismissive-Avoidant", text: "You value self-reliance and may keep emotional distance to feel safe. Letting people in a little at a time can deepen your relationships." };
    },
  },
];

// Small deterministic PRNG so each question's option order is stable across visits.
function seededShuffle(arr, seed) {
  const out = [...arr];
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function hashString(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Build the question list for a test. Dimension items are interleaved round-robin;
// a test's optional `choiceItems` (each option belongs to a different dimension)
// are alternated in between. Each option's `value` is 1–4 (its position as written),
// which is what gets stored, so the on-screen shuffle never affects scoring.
// Items are either a plain [text, options] pair or an object of audience variants.
function pickVariant(item, audience) {
  if (Array.isArray(item)) return item;
  return item[audience] || Object.values(item)[0];
}

function buildQuestions(test, audience) {
  const ranked = [];
  const max = Math.max(...test.dimensions.map((d) => d.items.length));
  for (let i = 0; i < max; i++) {
    for (const dim of test.dimensions) {
      if (!dim.items[i]) continue;
      const [text, opts] = pickVariant(dim.items[i], audience);
      const options = seededShuffle(
        opts.map((o, rank) => ({ text: o, value: rank + 1 })),
        hashString(test.id + text)
      );
      ranked.push({ text, options, dim: dim.key });
    }
  }

  const choice = (test.choiceItems || []).map((item) => pickVariant(item, audience)).map(([text, opts]) => ({
    text,
    choice: true,
    options: seededShuffle(
      opts.map(([dim, o], i) => ({ text: o, value: i + 1, dim })),
      hashString(test.id + text)
    ),
  }));

  const out = [];
  for (let i = 0; i < Math.max(ranked.length, choice.length); i++) {
    if (ranked[i]) out.push(ranked[i]);
    if (choice[i]) out.push(choice[i]);
  }
  return out;
}

function questionCount(test) {
  return test.dimensions.reduce((n, d) => n + d.items.length, 0) + (test.choiceItems || []).length;
}

function estMinutes(test) {
  return Math.max(5, Math.round(questionCount(test) * 0.4));
}

// Ranked questions give 0–3 points to their dimension. Choice questions give 3 points
// to the chosen option's dimension, and count toward the maximum of every dimension offered.
// Audience variants share option order, so scoring never depends on which variant was shown.
function scoreTest(test, answers) {
  const questions = buildQuestions(test);
  const points = {}, max = {};
  for (const d of test.dimensions) points[d.key] = max[d.key] = 0;

  questions.forEach((q, i) => {
    if (q.choice) {
      for (const o of q.options) max[o.dim] += 3;
      points[q.options.find((o) => o.value === answers[i]).dim] += 3;
    } else {
      max[q.dim] += 3;
      points[q.dim] += answers[i] - 1;
    }
  });

  return test.dimensions.map((dim) => ({
    key: dim.key,
    name: dim.name,
    pct: max[dim.key] ? Math.round((points[dim.key] / max[dim.key]) * 100) : 0,
    dim,
  }));
}
