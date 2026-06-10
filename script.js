const notifyForm = document.getElementById("notifyForm");
const emailInput = document.getElementById("email");
const formMessage = document.getElementById("formMessage");
const memeRows = Array.from(document.querySelectorAll(".meme-row"));
const memeStream = document.querySelector(".meme-stream");
let liveMemePool = [];
let fallbackIndex = 0;
const TARGET_MEME_TILES = 25;
let masonryOffset = 0;
let lastTick = 0;
let memeCursor = 0;
let shuffledPool = [];
const recentQueue = [];
const recentSet = new Set();
const RECENT_LIMIT = 700;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function markFontsReady() {
  try {
    if (document.fonts && document.fonts.load) {
      await document.fonts.load('1em "Irish Grover"');
    }
  } catch {}
  document.documentElement.classList.remove("fonts-loading");
  document.documentElement.classList.add("fonts-ready");
}

function normalizeMemeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg") || clean.endsWith(".png") || clean.endsWith(".webp")) {
    return url;
  }
  return null;
}

async function fetchLiveMemes() {
  try {
    const batchSize = 50;
    const batches = 4; // 4 * 50 = 200 memes target
    const requests = Array.from({ length: batches }, () =>
      fetch(`https://meme-api.com/gimme/${batchSize}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    );

    const payloads = await Promise.all(requests);
    const urls = payloads.flatMap((payload) =>
      Array.isArray(payload?.memes) ? payload.memes.map((item) => item?.url) : []
    );

    const unique = [...new Set(urls.map((u) => normalizeMemeUrl(u)).filter(Boolean))];
    return unique;
  } catch {
    return [];
  }
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function primeMemePool(urls) {
  shuffledPool = shuffle([...new Set(urls.map((u) => getSourceKey(u)).filter(Boolean))]);
  memeCursor = 0;
}

function markRecent(url) {
  if (!url) return;
  if (recentSet.has(url)) return;
  recentSet.add(url);
  recentQueue.push(url);
  if (recentQueue.length > RECENT_LIMIT) {
    const old = recentQueue.shift();
    if (old) recentSet.delete(old);
  }
}

function nextMeme(excludeSet) {
  if (!shuffledPool.length) return null;
  let tries = 0;
  const maxTries = shuffledPool.length * 2;
  while (tries < maxTries) {
    const candidate = shuffledPool[memeCursor % shuffledPool.length];
    memeCursor += 1;
    tries += 1;
    if (!excludeSet.has(candidate) && !recentSet.has(candidate)) {
      markRecent(candidate);
      return candidate;
    }
  }
  // Fallback if pool is constrained.
  const fallback = shuffledPool[memeCursor % shuffledPool.length];
  memeCursor += 1;
  markRecent(fallback);
  return fallback;
}

function getSourceKey(src) {
  try {
    const url = new URL(src, window.location.href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return src || "";
  }
}

function distributeMemes(urls) {
  if (!urls.length) return;
  const images = Array.from(document.querySelectorAll(".meme-tile img"));
  if (!images.length) return;

  primeMemePool(urls);
  const current = new Set();
  images.forEach((img) => {
    const candidate = nextMeme(current);
    if (candidate) {
      img.src = candidate;
      current.add(candidate);
    }
  });
}

function buildMemeGrid(urls, targetCount = TARGET_MEME_TILES) {
  if (!urls.length || !memeRows.length) return;

  const pool = shuffle(urls);
  memeRows.forEach((row) => {
    row.innerHTML = "";
  });

  for (let i = 0; i < targetCount; i += 1) {
    const row = memeRows[i % memeRows.length];
    const figure = document.createElement("figure");
    figure.className = "meme-tile";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = "";
    img.src = pool[i % pool.length];

    figure.appendChild(img);
    row.appendChild(figure);
  }
}

function computeTileTarget() {
  return TARGET_MEME_TILES;
}

function bindMemeFallbacks() {
  const tiles = document.querySelectorAll(".meme-tile img");
  tiles.forEach((img) => {
    img.onerror = () => {
      if (!liveMemePool.length) {
        const tile = img.closest(".meme-tile");
        if (tile) tile.remove();
        return;
      }
      fallbackIndex = (fallbackIndex + 1) % liveMemePool.length;
      img.src = liveMemePool[fallbackIndex];
    };
  });
}

function refreshMemes() {
  if (!liveMemePool.length) return;
  distributeMemes(liveMemePool);
  bindMemeFallbacks();
}

function evolveMemeTiles(ratio = 0.08) {
  if (!liveMemePool.length) return;
  const tiles = Array.from(document.querySelectorAll(".meme-tile img"));
  if (!tiles.length) return;

  const current = new Set(tiles.map((tile) => getSourceKey(tile.src)));

  const swapCount = Math.max(12, Math.floor(tiles.length * ratio));
  const shuffledTiles = shuffle(tiles);

  for (let i = 0; i < swapCount; i += 1) {
    const tile = shuffledTiles[i % shuffledTiles.length];
    const nextUrl = nextMeme(current);
    if (!tile || !nextUrl) continue;

    current.delete(getSourceKey(tile.src));
    tile.src = nextUrl;
    current.add(nextUrl);
  }
}

function startMasonryTicker() {
  if (!memeStream) return;

  const speedPxPerSec = 18;
  const wrapStepPx = 72;

  function tick(now) {
    if (!lastTick) lastTick = now;
    const delta = (now - lastTick) / 1000;
    lastTick = now;

    masonryOffset -= speedPxPerSec * delta;
    if (masonryOffset <= -wrapStepPx) {
      masonryOffset += wrapStepPx;
    }

    memeStream.style.transform = `translate3d(0, ${masonryOffset}px, 0)`;
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

window.addEventListener("load", async () => {
  markFontsReady();
  const liveMemes = await fetchLiveMemes();
  if (liveMemes.length) {
    liveMemePool = liveMemes;
    buildMemeGrid(liveMemePool, computeTileTarget());
    distributeMemes(liveMemePool);
    bindMemeFallbacks();
    // Rebuild once after images settle to eliminate any late-layout gaps.
    setTimeout(() => {
      buildMemeGrid(liveMemePool, computeTileTarget());
      distributeMemes(liveMemePool);
      bindMemeFallbacks();
    }, 1200);
    // No live tile swapping during motion; prevents reflow jerk.
    startMasonryTicker();
  }
}, { once: true });

notifyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const normalizedEmail = email.toLowerCase();

  formMessage.classList.remove("success", "error");

  if (!emailPattern.test(email)) {
    formMessage.textContent = "Enter a valid email address.";
    formMessage.classList.add("error");
    emailInput.focus();
    return;
  }

  const saved = JSON.parse(localStorage.getItem("memotionsNotifyList") || "[]");

  if (saved.includes(normalizedEmail)) {
    formMessage.textContent = "This email is already on the notification list.";
    formMessage.classList.add("error");
    return;
  }

  saved.push(normalizedEmail);
  localStorage.setItem("memotionsNotifyList", JSON.stringify(saved));

  formMessage.textContent = "You are on the launch list.";
  formMessage.classList.add("success");
  notifyForm.reset();
});
