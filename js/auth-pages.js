// Logic for login, signup, forgot-password and reset-password pages.
const form = document.getElementById("form");
const msgEl = document.getElementById("msg");
const page = (location.pathname.match(/(login|signup|forgot-password|reset-password)/) || [])[1];
const next = nextParam();

function showMsg(type, html) {
  msgEl.innerHTML = `<div class="alert alert-${type}">${html}</div>`;
}

function setBusy(busy, label) {
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = busy;
  if (label) btn.textContent = label;
}

function friendlyError(error) {
  const m = error?.message || "Something went wrong. Please try again.";
  if (/invalid login credentials/i.test(m)) return "Incorrect email or password.";
  if (/rate limit|too many/i.test(m)) return "Too many attempts. Please wait a minute and try again.";
  return escapeHtml(m);
}

function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

// Carry ?next= between the sign-in and sign-up pages.
for (const id of ["to-signup", "to-login"]) {
  const a = document.getElementById(id);
  if (a && next) a.href += `?next=${encodeURIComponent(next)}`;
}

async function initLogin(user) {
  if (user) return location.replace(safeNext(next));
  if (new URLSearchParams(location.search).get("confirmed")) {
    showMsg("success", "Your email is confirmed. Sign in to continue.");
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!validEmail(email) || !password) return showMsg("error", "Enter your email and password.");

    setBusy(true, "Signing in…");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (!error) return location.replace(safeNext(next));

    setBusy(false, "Sign in");
    if (/email not confirmed/i.test(error.message)) {
      showMsg("warn", `Please confirm your email first. <button class="link-btn" id="resend">Resend confirmation email</button>`);
      document.getElementById("resend").onclick = async () => {
        const { error: err } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmRedirect() } });
        showMsg(err ? "error" : "success", err ? friendlyError(err) : "Confirmation email sent. Check your inbox.");
      };
    } else {
      showMsg("error", friendlyError(error));
    }
  };
}

function confirmRedirect() {
  const n = next ? `&next=${encodeURIComponent(next)}` : "";
  return `${location.origin}/login.html?confirmed=1${n}`;
}

async function initSignup(user) {
  if (user) return location.replace(safeNext(next));

  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!name) return showMsg("error", "Please enter your name.");
    if (!validEmail(email)) return showMsg("error", "Please enter a valid email address.");
    if (password.length < 8) return showMsg("error", "Password must be at least 8 characters.");
    if (!form.terms.checked) return showMsg("error", "Please accept the Terms and Privacy Policy.");

    setBusy(true, "Creating account…");
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: confirmRedirect() },
    });
    setBusy(false, "Create account");

    if (error) return showMsg("error", friendlyError(error));
    if (data.session) return location.replace(safeNext(next));
    // With email confirmation on, Supabase returns a user with no identities for an existing email.
    if (data.user && data.user.identities?.length === 0) {
      return showMsg("error", `An account with this email already exists. <a href="login.html${next ? `?next=${encodeURIComponent(next)}` : ""}">Sign in instead</a>.`);
    }

    form.closest(".auth-card").innerHTML = `
      <div class="gate-icon" aria-hidden="true">📬</div>
      <h1>Check your inbox</h1>
      <p class="muted">We sent a confirmation link to <strong>${escapeHtml(email)}</strong>. Click it to activate your account, and you'll be brought right back to your results.</p>
      <p class="note">Can't find it? Check your spam folder.</p>`;
  };
}

function initForgot() {
  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!validEmail(email)) return showMsg("error", "Please enter a valid email address.");

    setBusy(true, "Sending…");
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password.html`,
    });
    setBusy(false, "Send reset link");
    if (error) return showMsg("error", friendlyError(error));
    showMsg("success", "If an account exists for that email, a reset link is on its way.");
    form.reset();
  };
}

function initReset(user) {
  if (!user) {
    form.hidden = true;
    return showMsg("error", `This reset link is invalid or has expired. <a href="forgot-password.html">Request a new one</a>.`);
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const password = form.password.value;
    if (password.length < 8) return showMsg("error", "Password must be at least 8 characters.");
    if (password !== form.confirm.value) return showMsg("error", "Passwords don't match.");

    setBusy(true, "Updating…");
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false, "Update password");
    if (error) return showMsg("error", friendlyError(error));
    showMsg("success", "Password updated. Taking you to your results…");
    setTimeout(() => location.replace("dashboard.html"), 1500);
  };
}

userReady.then((user) => {
  if (!sb) {
    msgEl.innerHTML = notConfiguredHtml;
    form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
    return;
  }
  ({ login: initLogin, signup: initSignup, "forgot-password": initForgot, "reset-password": initReset })[page](user);
});
