const app = document.getElementById("app");
const params = new URLSearchParams(location.search);
const test = TESTS.find((t) => t.id === params.get("id"));

const PENDING_KEY = "tl-pending"; // finished answers waiting for the user to sign in
const progressKey = test && `tl-progress-${test.id}`;

let user = null;
let audience = null; // e.g. "student" / "professional" for tests with audience variants
let questions = [];
let answers = [];
let current = 0;

// Answers are encoded as a string of digits 1–4 (the chosen option's rank), e.g. "3142…",
// so results can be shared by URL. 0 marks an unanswered question in saved progress.
function encode(arr) { return arr.join(""); }
function decode(str) {
  if (!str || str.length !== questions.length || !/^[1-4]+$/.test(str)) return null;
  return [...str].map(Number);
}

// Returns the locally stored finished-but-unsaved result for this test. The caller must
// validate the code with decode() once questions are built.
function getPending() {
  try {
    const p = JSON.parse(storageGet(PENDING_KEY));
    return p && p.id === test.id ? p : null;
  } catch { return null; }
}

// This test's URL without the one-off ?p= / ?a= params, so a reload can't re-save a result.
function basePath() {
  return `${location.pathname}?id=${encodeURIComponent(test.id)}`;
}

function validAudience(key) {
  return test.audiences?.some((a) => a.key === key) ? key : null;
}

function audiencePicker() {
  if (!test.audiences) return "";
  return `
    <p class="picker-label"><strong>Which describes you best?</strong> We'll tailor the scenarios and career advice to you.</p>
    <div class="audience-picker" role="radiogroup">
      ${test.audiences.map((a) => `
        <button role="radio" aria-checked="${a.key === audience}" class="audience${a.key === audience ? " selected" : ""}" data-audience="${a.key}">
          <span class="audience-emoji">${a.emoji}</span>
          <span><strong>${a.label}</strong><small>${a.hint}</small></span>
        </button>`).join("")}
    </div>`;
}

function renderIntro() {
  const partial = storageGet(progressKey);
  const answered = partial ? partial.replace(/0/g, "").length : 0;

  app.innerHTML = `
    <div class="intro">
      <h1>${test.title}</h1>
      <p>${test.description}</p>
      <div class="tags">
        <span class="tag level">${test.difficulty}</span>
        <span class="tag">${questions.length} questions</span>
        <span class="tag">${estMinutes(test)} mins</span>
      </div>
      ${audiencePicker()}
      <p>You'll read ${questions.length} everyday situations. For each one, pick the response closest to what you would <em>actually</em> do, not what you think you should do. There are no right or wrong answers.</p>
      <div class="actions" style="justify-content:flex-start">
        ${answered > 0 && answered < questions.length
          ? `<button class="btn btn-primary" id="resume">Resume (${answered}/${questions.length})</button>
             <button class="btn btn-ghost" id="start">Start over</button>`
          : `<button class="btn btn-primary" id="start" ${test.audiences && !audience ? "disabled" : ""}>Start test</button>`}
      </div>
      ${user ? "" : `<p class="note" style="text-align:left">You'll need a free account to see your results. You can create one when you finish.</p>`}
    </div>`;

  app.querySelectorAll("[data-audience]").forEach((b) => {
    b.onclick = () => {
      audience = b.dataset.audience;
      saveProfile({ stage: audience }, user);
      questions = buildQuestions(test, audience);
      renderIntro();
    };
  });

  document.getElementById("start").onclick = () => {
    answers = new Array(questions.length).fill(0);
    storageRemove(progressKey);
    current = 0;
    renderQuestion();
  };
  const resume = document.getElementById("resume");
  if (resume) {
    resume.onclick = () => {
      answers = [...partial].map(Number);
      current = Math.max(0, answers.indexOf(0));
      renderQuestion();
    };
  }
}

function renderQuestion() {
  const q = questions[current];
  const pct = (answers.filter(Boolean).length / questions.length) * 100;

  app.innerHTML = `
    <div class="quiz-head">
      <strong>${test.title}</strong>
      <span>${current + 1} / ${questions.length}</span>
    </div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="scenario-label">Scenario ${current + 1}</div>
    <p class="scenario">${q.text}</p>
    <div class="options" role="radiogroup" aria-label="Your response">
      ${q.options.map(
        (o, i) => `<button role="radio" aria-checked="${answers[current] === o.value}" class="option${answers[current] === o.value ? " selected" : ""}" data-v="${o.value}"><span class="letter">${"ABCD"[i]}</span><span>${o.text}</span></button>`
      ).join("")}
    </div>
    <div class="quiz-nav">
      <button class="btn btn-ghost" id="back" ${current === 0 ? "disabled" : ""}>← Back</button>
      <button class="btn btn-ghost" id="next" ${answers[current] ? "" : "disabled"}>${current === questions.length - 1 ? "See results" : "Next →"}</button>
    </div>`;

  app.querySelectorAll(".option").forEach((b) => {
    b.onclick = () => {
      answers[current] = Number(b.dataset.v);
      storageSet(progressKey, encode(answers));
      advance();
    };
  });
  document.getElementById("back").onclick = () => { current--; renderQuestion(); };
  document.getElementById("next").onclick = advance;
}

async function advance() {
  if (current < questions.length - 1) {
    current++;
    renderQuestion();
    return;
  }
  const firstMissing = answers.indexOf(0);
  if (firstMissing !== -1) {
    current = firstMissing;
    toast("Please answer every question");
    renderQuestion();
    return;
  }
  const code = encode(answers);
  storageRemove(progressKey);
  if (user) {
    await saveResult(code);
    showResults(code);
  } else {
    storageSet(PENDING_KEY, JSON.stringify({ id: test.id, code, a: audience }));
    renderGate(code);
  }
}

async function saveResult(code) {
  const { error } = await sb.from("results").insert({ test_id: test.id, answers: code });
  if (error) toast("Couldn't save your result to your account");
}

function showResults(code) {
  const a = audience ? `&a=${audience}` : "";
  history.replaceState(null, "", `${basePath()}#r=${code}${a}`);
  renderResults(decode(code));
}

// `code` travels inside the sign-up/sign-in link (?p=…) so the result survives even if the
// confirmation email is opened in another browser or device. A shared link (someone else's
// result) just returns to that link and is never saved to the viewer's account.
function renderGate(code, isShared = false) {
  const a = audience ? `&a=${audience}` : "";
  const next = encodeURIComponent(
    isShared ? `test.html?id=${test.id}#r=${code}${a}` : `test.html?id=${test.id}&p=${code}${a}`
  );
  const teaser = test.dimensions
    .map(
      (d) => `
      <div class="dim">
        <div class="dim-head"><span>${d.name}</span><span class="lvl">●●● · ●●%</span></div>
        <div class="bar"><div style="width:${30 + ((d.key.charCodeAt(0) * 37) % 55)}%"></div></div>
      </div>`
    )
    .join("");

  app.innerHTML = `
    <div class="gate">
      <div class="gate-icon" aria-hidden="true">🔒</div>
      <h1>Your results are ready!</h1>
      <p>Create a free account to unlock your full <strong>${test.title}</strong> results. They'll be saved so you can come back to them any time.</p>
      ${sb ? "" : notConfiguredHtml}
      <div class="actions">
        <a class="btn btn-primary" href="signup.html?next=${next}">Sign up free</a>
        <a class="btn btn-ghost" href="login.html?next=${next}">I already have an account</a>
      </div>
      <p class="note">Free forever. No credit card required. · <button class="link-btn" id="discard">Discard and retake</button></p>
    </div>
    <div class="teaser" aria-hidden="true">${teaser}</div>`;

  document.getElementById("discard").onclick = () => {
    storageRemove(PENDING_KEY);
    history.replaceState(null, "", basePath());
    renderIntro();
  };
}

function level(pct) {
  if (pct >= 65) return "High";
  if (pct <= 35) return "Low";
  return "Moderate";
}

function renderResults(ans) {
  const scores = scoreTest(test, ans);
  const s = test.summary(scores);
  const scoreHtml =
    test.scoreLabel && s.score != null
      ? `<div class="big-score">${test.scoreLabel}:<b>${s.score}${test.scoreSuffix ?? "/100"}</b></div>`
      : "";

  app.innerHTML = `
    <div class="result-hero">
      <div class="eyebrow">${test.title} · Your result</div>
      <h1>${s.title}</h1>
      <p>${s.text}</p>
      ${scoreHtml}
    </div>
    ${scores
      .map((d) => {
        const lvl = level(d.pct);
        const text = lvl === "High" ? d.dim.high : lvl === "Low" ? d.dim.low : `You sit between both ends. At times: ${d.dim.high.charAt(0).toLowerCase() + d.dim.high.slice(1)}`;
        return `
        <div class="dim">
          <div class="dim-head"><span>${d.name}</span><span class="lvl">${lvl} · ${d.pct}%</span></div>
          <div class="bar"><div style="width:${Math.max(d.pct, 2)}%"></div></div>
          <p>${text}</p>
        </div>`;
      })
      .join("")}
    ${test.extraResults ? test.extraResults(scores, audience) : ""}
    <div class="actions">
      <button class="btn btn-primary" id="share-image">📸 Share as image</button>
      <button class="btn btn-ghost" id="share">Copy link</button>
      <button class="btn btn-ghost" id="print">Save as PDF</button>
      <button class="btn btn-ghost" id="retake">Retake test</button>
      <a class="btn btn-ghost" href="dashboard.html">My results</a>
    </div>
    <p class="note">For self-reflection only. This is not a clinical or diagnostic assessment.</p>`;

  document.getElementById("share-image").onclick = () =>
    openShareModal({
      siteName: CFG.siteName || "Mindmirror",
      siteUrl: CFG.siteUrl || location.host,
      testId: test.id,
      testTitle: test.title,
      emoji: test.emoji,
      resultTitle: s.title,
      summary: s.share || firstSentence(s.text),
      scoreText: test.scoreLabel && s.score != null ? `${test.scoreLabel}: ${s.score}${test.scoreSuffix ?? "/100"}` : "",
      bars: scores.map((d) => ({ name: d.name, pct: d.pct })),
    });
  document.getElementById("share").onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Link copied!");
    } catch {
      prompt("Copy this link:", location.href);
    }
  };
  document.getElementById("print").onclick = () => window.print();
  document.getElementById("retake").onclick = () => {
    history.replaceState(null, "", basePath());
    answers = new Array(questions.length).fill(0);
    current = 0;
    renderQuestion();
  };
  window.scrollTo(0, 0);
}

async function init() {
  if (!test) {
    app.innerHTML = `<h1>Test not found</h1><p>That test doesn't exist. <a href="/">Back to the library</a>.</p>`;
    return;
  }
  document.title = `${test.title} · ${CFG.siteName || "Mindmirror"}`;
  user = await userReady;

  const hash = new URLSearchParams(location.hash.slice(1));
  const shared = hash.get("r");
  const local = getPending();
  audience =
    validAudience(hash.get("a")) ||
    validAudience(params.get("a")) ||
    validAudience(local?.a) ||
    validAudience(getProfile(user).stage);
  // Questions must exist before any decode(), which checks the answer count.
  questions = buildQuestions(test, audience);
  const pending = [params.get("p"), local?.code].find((c) => decode(c)) || null;

  if (shared && decode(shared)) {
    // Results (including shared links) are only visible to signed-in users.
    if (user) renderResults(decode(shared));
    else renderGate(shared, true);
  } else if (pending && user) {
    // Just signed up / signed in after finishing the test: save, then reveal.
    storageRemove(PENDING_KEY);
    await saveResult(pending);
    showResults(pending);
  } else if (pending) {
    renderGate(pending);
  } else {
    renderIntro();
  }
}

init();
