// Draws a branded result card on a <canvas> and offers download / native share.

const SHARE_FORMATS = {
  story: { w: 1080, h: 1920, label: "Story" },
  square: { w: 1080, h: 1080, label: "Square" },
};

const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

function wrapLines(ctx, text, maxWidth, maxLines = Infinity) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function firstSentence(text) {
  const m = text.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : text).trim();
}

async function drawShareImage(canvas, data, format) {
  const { w, h } = SHARE_FORMATS[format];
  const story = format === "story";
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  try {
    await Promise.all(["800 100px Inter", "600 40px Inter", "500 40px Inter"].map((f) => document.fonts.load(f)));
  } catch {}

  const pad = story ? 96 : 80;
  const maxW = w - pad * 2;
  const font = (weight, size) => `${weight} ${size}px Inter, system-ui, sans-serif`;

  // Background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#6d36a3");
  bg.addColorStop(1, "#2a0f42");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (const [cx, cy, r] of [[w - 90, story ? 260 : 150, story ? 300 : 220], [60, h - (story ? 260 : 120), story ? 220 : 160]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textBaseline = "top";
  let y = pad;

  // Brand
  ctx.font = font(800, story ? 52 : 42);
  ctx.fillStyle = "#fff";
  ctx.fillText(data.siteName, pad, y);
  ctx.fillStyle = "#7ee2a8";
  ctx.fillText(".", pad + ctx.measureText(data.siteName).width, y);
  y += story ? 190 : 110;

  // Emoji
  if (story && data.emoji) {
    ctx.font = `140px ${EMOJI_FONT}`;
    ctx.fillText(data.emoji, pad, y);
    y += 190;
  }

  // Eyebrow: test name
  ctx.font = font(600, story ? 38 : 30);
  ctx.fillStyle = "#c9f2d7";
  for (const line of wrapLines(ctx, `${data.testTitle.toUpperCase()} · MY RESULT`, maxW, 2)) {
    ctx.fillText(line, pad, y);
    y += story ? 50 : 40;
  }
  y += story ? 24 : 14;

  // Result title
  // Shrink the title until its longest word fits (e.g. "Organiser–Thinker").
  let titleSize = story ? 112 : 80;
  ctx.font = font(800, titleSize);
  while (titleSize > 48 && data.resultTitle.split(/\s+/).some((wd) => ctx.measureText(wd).width > maxW)) {
    titleSize -= 4;
    ctx.font = font(800, titleSize);
  }
  ctx.fillStyle = "#fff";
  for (const line of wrapLines(ctx, data.resultTitle, maxW, 3)) {
    ctx.fillText(line, pad, y);
    y += titleSize * 1.08;
  }
  y += story ? 30 : 20;

  // Score pill
  if (data.scoreText) {
    ctx.font = font(600, story ? 40 : 32);
    const tw = ctx.measureText(data.scoreText).width;
    const ph = story ? 76 : 60;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundRect(ctx, pad, y, tw + 56, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(data.scoreText, pad + 28, y + (ph - (story ? 40 : 32)) / 2 + 2);
    y += ph + (story ? 44 : 30);
  }

  // One-line summary (story only, there's room)
  if (story && data.summary) {
    ctx.font = font(500, 44);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const line of wrapLines(ctx, data.summary, maxW, 4)) {
      ctx.fillText(line, pad, y);
      y += 62;
    }
  }

  // Dimension bars, pinned above the footer
  const footerH = story ? 90 : 60;
  const rowH = (story ? 100 : 74) - (data.bars.length > 5 ? 8 : 0);
  const barsH = data.bars.length * rowH;
  y = Math.max(y + (story ? 60 : 10), h - pad - footerH - barsH);
  const labelSize = story ? 36 : 28;
  const barH = story ? 20 : 16;
  for (const b of data.bars) {
    ctx.font = font(600, labelSize);
    ctx.fillStyle = "#fff";
    ctx.fillText(b.name, pad, y);
    const pctText = `${b.pct}%`;
    ctx.fillText(pctText, w - pad - ctx.measureText(pctText).width, y);
    const by = y + labelSize + (story ? 14 : 10);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, pad, by, maxW, barH, barH / 2);
    ctx.fill();
    const fill = ctx.createLinearGradient(pad, 0, pad + maxW, 0);
    fill.addColorStop(0, "#2fbf71");
    fill.addColorStop(1, "#7ee2a8");
    ctx.fillStyle = fill;
    roundRect(ctx, pad, by, Math.max(barH, (maxW * b.pct) / 100), barH, barH / 2);
    ctx.fill();
    y += rowH;
  }

  // Footer call to action
  ctx.font = font(600, story ? 38 : 30);
  const cta = "Take the free test at ";
  const fy = h - pad - (story ? 40 : 30);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(cta, pad, fy);
  ctx.fillStyle = "#7ee2a8";
  ctx.fillText(data.siteUrl, pad + ctx.measureText(cta).width, fy);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function openShareModal(data) {
  let format = "story";
  const slug = (data.siteName || "result").toLowerCase().replace(/\W+/g, "-");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div class="modal-head">
        <h2 id="share-title">Share your result</h2>
        <button class="modal-close" aria-label="Close">×</button>
      </div>
      <div class="format-toggle" role="tablist">
        ${Object.entries(SHARE_FORMATS)
          .map(([k, f]) => `<button role="tab" data-format="${k}" class="${k === format ? "active" : ""}">${f.label}</button>`)
          .join("")}
      </div>
      <div class="share-preview"><canvas></canvas></div>
      <div class="actions">
        <button class="btn btn-primary" id="share-native" hidden>Share</button>
        <button class="btn btn-ghost" id="share-download">Download image</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const canvas = overlay.querySelector("canvas");
  const shareBtn = overlay.querySelector("#share-native");
  const close = () => {
    overlay.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };

  async function redraw() {
    overlay.querySelectorAll("[data-format]").forEach((b) => b.classList.toggle("active", b.dataset.format === format));
    canvas.className = format;
    await drawShareImage(canvas, data, format);
  }

  async function currentFile() {
    const blob = await canvasToBlob(canvas);
    return new File([blob], `${slug}-${data.testId}-${format}.png`, { type: "image/png" });
  }

  // Native share sheet (mostly phones) only when the browser can share files.
  try {
    const probe = new File([""], "probe.png", { type: "image/png" });
    shareBtn.hidden = !(navigator.canShare && navigator.canShare({ files: [probe] }));
  } catch {
    shareBtn.hidden = true;
  }

  shareBtn.onclick = async () => {
    try {
      await navigator.share({ files: [await currentFile()], title: data.resultTitle, text: `I got "${data.resultTitle}" on the ${data.testTitle}! Take it free at ${data.siteUrl}` });
    } catch (e) {
      if (e.name !== "AbortError") toast("Sharing isn't available. Try downloading instead.");
    }
  };

  overlay.querySelector("#share-download").onclick = async () => {
    const file = await currentFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Image downloaded");
  };

  overlay.querySelectorAll("[data-format]").forEach((b) => {
    b.onclick = () => { format = b.dataset.format; redraw(); };
  });
  overlay.querySelector(".modal-close").onclick = close;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", onKey);

  redraw();
  overlay.querySelector(".modal-close").focus();
}
