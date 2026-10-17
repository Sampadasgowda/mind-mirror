const grid = document.getElementById("grid");
const search = document.getElementById("search");
const filtersEl = document.getElementById("filters");

const categories = ["All", ...new Set(TESTS.map((t) => t.category))];
let activeCategory = "All";
let completed = {}; // test_id → latest answers code, for the signed-in user

function renderFilters() {
  filtersEl.innerHTML = categories
    .map((c) => `<button class="filter${c === activeCategory ? " active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
}

function renderGrid() {
  const q = search.value.trim().toLowerCase();
  const list = TESTS.filter(
    (t) =>
      (activeCategory === "All" || t.category === activeCategory) &&
      (t.title + " " + t.description).toLowerCase().includes(q)
  );

  if (!list.length) {
    grid.innerHTML = `<div class="empty">No tests match "${escapeHtml(q)}".</div>`;
    return;
  }

  grid.innerHTML = list
    .map((t) => {
      const saved = completed[t.id];
      return `
      <article class="card">
        <h2>${t.title}</h2>
        <p>${t.description}</p>
        <div class="tags">
          <span class="tag level">${t.difficulty}</span>
          <span class="tag">${questionCount(t)} questions</span>
          <span class="tag">${estMinutes(t)} mins</span>
        </div>
        <a class="btn btn-outline" href="test.html?id=${t.id}">${saved ? "Retake" : "Try now"}</a>
        ${saved ? `<a class="done-link" href="test.html?id=${t.id}#r=${saved}">✓ Completed: view your result</a>` : ""}
      </article>`;
    })
    .join("");
}

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter");
  if (!btn) return;
  activeCategory = btn.dataset.cat;
  renderFilters();
  renderGrid();
});
search.addEventListener("input", renderGrid);

renderFilters();
renderGrid();

userReady.then(async (user) => {
  if (!user) return;
  const { data, error } = await sb
    .from("results")
    .select("test_id, answers")
    .order("created_at", { ascending: false });
  if (error) return;
  for (const r of data) if (!completed[r.test_id]) completed[r.test_id] = r.answers;
  renderGrid();
});
