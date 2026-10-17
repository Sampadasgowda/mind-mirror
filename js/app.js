// Shared across every page: Supabase client, header/footer, small helpers.
const CFG = window.TL_CONFIG || {};
const sb =
  CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase
    ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey)
    : null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2000);
}

// Only allow same-site relative redirects (blocks "//evil.com" and "https://…").
function safeNext(next, fallback = "dashboard.html") {
  if (!next || /^[a-z]+:|^\/\/|\\/i.test(next)) return fallback;
  return next;
}

function nextParam() {
  return safeNext(new URLSearchParams(location.search).get("next"), "");
}

function displayName(user) {
  return user.user_metadata?.full_name || user.email.split("@")[0];
}

// The user's profile (e.g. { stage: "student" }) personalises tests. Signed-in users keep it
// in their Supabase account metadata so it follows them across devices; guests keep it locally.
const PROFILE_KEY = "tl-profile";

function getProfile(user) {
  if (user?.user_metadata?.profile) return user.user_metadata.profile;
  try { return JSON.parse(storageGet(PROFILE_KEY)) || {}; } catch { return {}; }
}

function saveProfile(patch, user) {
  const profile = { ...getProfile(user), ...patch };
  storageSet(PROFILE_KEY, JSON.stringify(profile));
  if (sb && user) {
    sb.auth.updateUser({ data: { profile } }).then(({ data }) => {
      if (data?.user) user.user_metadata = data.user.user_metadata;
    });
  }
  return profile;
}

async function getUser() {
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user ?? null;
}

function renderHeader(user) {
  const header = document.getElementById("site-header");
  if (!header) return;
  const onAuthPage = /(login|signup)(\.html)?$/.test(location.pathname);
  const here = onAuthPage ? nextParam() || "/" : location.pathname + location.search;
  const right = user
    ? `<a class="nav-link" href="dashboard.html">My results</a>
       <div class="user-menu">
         <button class="avatar" id="avatar-btn" aria-haspopup="true" aria-expanded="false" title="${escapeHtml(user.email)}">${escapeHtml(displayName(user).charAt(0).toUpperCase())}</button>
         <div class="menu" id="user-dropdown" hidden>
           <div class="menu-head"><strong>${escapeHtml(displayName(user))}</strong><span>${escapeHtml(user.email)}</span></div>
           <a href="dashboard.html">My results</a>
           <a href="reset-password.html">Change password</a>
           <button id="signout">Sign out</button>
         </div>
       </div>`
    : `<a class="nav-link" href="login.html?next=${encodeURIComponent(here)}">Sign in</a>
       <a class="btn btn-header" href="signup.html?next=${encodeURIComponent(here)}">Sign up free</a>`;

  header.innerHTML = `
    <div class="container">
      <a class="logo" href="/">${escapeHtml(CFG.siteName || "Mindmirror")}<span>.</span></a>
      <nav class="nav">
        <a class="nav-link hide-sm" href="/">Library</a>
        <a class="nav-link hide-sm" href="about.html">About</a>
        ${right}
      </nav>
    </div>`;

  const btn = document.getElementById("avatar-btn");
  if (btn) {
    const menu = document.getElementById("user-dropdown");
    btn.onclick = (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      btn.setAttribute("aria-expanded", String(!menu.hidden));
    };
    document.addEventListener("click", () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); });
    document.getElementById("signout").onclick = async () => {
      await sb.auth.signOut();
      location.href = "/";
    };
  }
}

function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;
  footer.innerHTML = `
    <div class="container footer-inner">
      <div>
        <strong>${escapeHtml(CFG.siteName || "Mindmirror")}</strong>
        <p>Free personality tests for self-reflection. Not a clinical or diagnostic tool.</p>
      </div>
      <nav>
        <a href="/">Library</a>
        <a href="about.html">About</a>
        <a href="privacy.html">Privacy</a>
        <a href="terms.html">Terms</a>
        <a href="mailto:${escapeHtml(CFG.contactEmail || "")}">Contact</a>
      </nav>
    </div>
    <div class="container copyright">© ${new Date().getFullYear()} ${escapeHtml(CFG.siteName || "Mindmirror")}</div>`;

  document.querySelectorAll(".contact-email").forEach((a) => {
    a.textContent = CFG.contactEmail || "";
    a.href = `mailto:${CFG.contactEmail || ""}`;
  });
}

const notConfiguredHtml = `
  <div class="alert alert-warn">
    Sign-in isn't set up yet. Add your Supabase URL and anon key in <code>js/config.js</code>.
  </div>`;

// Resolves to the signed-in user (or null) once the header is drawn.
const userReady = getUser().then((user) => {
  renderHeader(user);
  renderFooter();
  return user;
});
