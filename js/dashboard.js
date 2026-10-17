const dash = document.getElementById("dash");

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function summarize(row) {
  const test = TESTS.find((t) => t.id === row.test_id);
  if (!test || row.answers.length !== questionCount(test)) return null;
  const s = test.summary(scoreTest(test, [...row.answers].map(Number)));
  return { test, s };
}

async function render(user) {
  const { data: rows, error } = await sb
    .from("results")
    .select("id, test_id, answers, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    dash.innerHTML = `<div class="alert alert-error">Couldn't load your results. Please refresh the page.</div>`;
    return;
  }

  const items = rows.map((r) => ({ row: r, info: summarize(r) })).filter((x) => x.info);
  const done = new Set(items.map((x) => x.row.test_id));
  const todo = TESTS.filter((t) => !done.has(t.id));

  dash.innerHTML = `
    <section class="dash-head">
      <div>
        <h1>Hi, ${escapeHtml(displayName(user))} 👋</h1>
        <p class="muted">All your test results, saved in one place.</p>
      </div>
      <div class="stats">
        <div class="stat"><b>${items.length}</b><span>results</span></div>
        <div class="stat"><b>${done.size}/${TESTS.length}</b><span>tests taken</span></div>
      </div>
    </section>

    <h2 class="section-title">Your results</h2>
    ${items.length
      ? `<div class="result-list">${items
          .map(({ row, info }) => `
          <div class="result-row" data-id="${row.id}">
            <div>
              <div class="muted small">${info.test.title} · ${fmtDate(row.created_at)}</div>
              <div class="result-title">${info.s.title}${info.test.scoreLabel && info.s.score != null ? ` <span class="pill">${info.test.scoreLabel}: ${info.s.score}${info.test.scoreSuffix ?? "/100"}</span>` : ""}</div>
            </div>
            <div class="row-actions">
              <a class="btn btn-ghost btn-sm" href="test.html?id=${row.test_id}#r=${row.answers}">View</a>
              <button class="btn btn-ghost btn-sm danger" data-del="${row.id}">Delete</button>
            </div>
          </div>`)
          .join("")}</div>`
      : `<div class="empty-state">You haven't taken any tests yet. <a href="/">Browse the library →</a></div>`}

    ${todo.length
      ? `<h2 class="section-title">Tests to try next</h2>
         <div class="grid grid-sm">${todo
           .map((t) => `
           <article class="card card-sm">
             <h3>${t.title}</h3>
             <div class="tags"><span class="tag level">${t.difficulty}</span><span class="tag">${estMinutes(t)} mins</span></div>
             <a class="btn btn-outline btn-sm" href="test.html?id=${t.id}">Try now</a>
           </article>`)
           .join("")}</div>`
      : ""}`;

  dash.querySelectorAll("[data-del]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete this result? This can't be undone.")) return;
      const { error: err } = await sb.from("results").delete().eq("id", btn.dataset.del);
      if (err) return toast("Couldn't delete. Please try again.");
      toast("Result deleted");
      render(user);
    };
  });
}

userReady.then((user) => {
  if (!sb) {
    dash.innerHTML = notConfiguredHtml;
    return;
  }
  if (!user) {
    location.replace(`login.html?next=${encodeURIComponent("dashboard.html")}`);
    return;
  }
  render(user);
});
