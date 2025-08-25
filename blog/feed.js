let ALL_POSTS = [];
let BASE_GRID = []; // posts excluding featured
let FEATURED = null;

async function renderFeed() {
  const res = await fetch("posts.json", { cache: "no-store" });
  const posts = await res.json();

  // newest first
  posts.sort((a,b) => new Date(b.date) - new Date(a.date));

  // choose featured (explicit flag wins; else newest)
  const featIdx = posts.findIndex(p => p.featured === true);
  const idx = featIdx >= 0 ? featIdx : 0;
  FEATURED = posts[idx];
  BASE_GRID = posts.filter((_, i) => i !== idx);
  ALL_POSTS = posts;

  renderFeatured(FEATURED);

  // initial grid render (apply URL q if present)
  const initialQ = getQuery();
  const filtered = initialQ ? filterPosts(BASE_GRID, initialQ) : BASE_GRID;
  renderLatest(filtered);
  updateSearchMeta(initialQ, filtered.length);

  // wire up search
  attachSearchHandlers();
}

function hrefFor(p) {
  return p?.slug ? `post.html?slug=${encodeURIComponent(p.slug)}` : (p?.url || "#");
}

function renderFeatured(p) {
  const el = document.getElementById("featured");
  if (!el) return;
  if (!p) { el.innerHTML = ""; return; }
  const href = hrefFor(p);

  el.innerHTML = `
    <a class="feature-card" href="${href}">
      <div class="feature-body">
        ${p.category ? `<span class="kicker">${p.category}</span>` : ""}
        <h2 class="feature-title"><span>${p.title}</span></h2>
        <p class="feature-excerpt">${p.excerpt || ""}</p>
        <div class="feature-meta">
          <span>${new Date(p.date).toLocaleDateString()}</span>
          ${p.tags?.length ? `<span> · ${p.tags.join(", ")}</span>` : ""}
        </div>
      </div>
      ${p.hero ? `<div class="feature-media"><img src="${p.hero}" alt="${p.title}"></div>` : ""}
    </a>
  `;
}

function renderLatest(list) {
  const el = document.getElementById("latest");
  if (!el) return;

  if (!list.length) {
    el.innerHTML = `<p style="color:#6e6e73">No results.</p>`;
    return;
  }

  el.innerHTML = list.map(p => {
    const href = hrefFor(p);
    return `
      <a class="tile" href="${href}">
        <div class="tile-media">
          ${p.hero ? `<img src="${p.hero}" alt="${p.title}">` : ""}
          ${p.category ? `<span class="badge">BLOG</span>` : ""}
        </div>
        <div class="tile-body">
          ${p.category ? `<span class="kicker">${p.category}</span>` : ""}
          <h3 class="tile-title"><span>${p.title}</span></h3>
          <p class="tile-excerpt">${p.excerpt || ""}</p>
          <div class="tile-meta">
            <span>${new Date(p.date).toLocaleDateString()}</span>
            ${p.tags?.length ? `<span> · ${p.tags.join(", ")}</span>` : ""}
          </div>
        </div>
      </a>
    `;
  }).join("");
}

/* ---------- Search ---------- */

function attachSearchHandlers() {
  const input = document.getElementById("search");
  const clear = document.getElementById("search-clear");
  if (!input || !clear) return;

  // seed from URL
  const q = getQuery();
  if (q) input.value = q;

  const onInput = debounce(() => {
    const query = input.value.trim();
    setQuery(query);
    const results = query ? filterPosts(BASE_GRID, query) : BASE_GRID;
    renderLatest(results);
    updateSearchMeta(query, results.length);
  }, 200);

  input.addEventListener("input", onInput);
  clear.addEventListener("click", () => {
    input.value = "";
    setQuery("");
    renderLatest(BASE_GRID);
    updateSearchMeta("", BASE_GRID.length);
    input.focus();
  });
}

function filterPosts(list, query) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean); // AND match
  if (!tokens.length) return list;

  return list.filter(p => {
    const hay = [
      p.title || "",
      p.excerpt || "",
      p.category || "",
      Array.isArray(p.tags) ? p.tags.join(" ") : ""
    ].join(" ").toLowerCase();

    return tokens.every(t => hay.includes(t));
  });
}

function updateSearchMeta(query, count) {
  const meta = document.getElementById("search-meta");
  if (!meta) return;
  if (!query) { meta.textContent = ""; return; }
  meta.textContent = `${count} result${count === 1 ? "" : "s"} for “${query}”`;
}

/* URL helpers (?q=...) */
function getQuery() {
  const url = new URL(location.href);
  return url.searchParams.get("q") || "";
}
function setQuery(q) {
  const url = new URL(location.href);
  if (q) url.searchParams.set("q", q);
  else url.searchParams.delete("q");
  history.replaceState(null, "", url.toString());
}

/* Debounce utility */
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

document.addEventListener("DOMContentLoaded", renderFeed);

