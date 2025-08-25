async function renderFeed() {
  const res = await fetch("posts.json", { cache: "no-store" });
  const posts = await res.json();

  // newest first
  posts.sort((a,b) => new Date(b.date) - new Date(a.date));

  // choose featured (explicit flag wins; else newest)
  const featIdx = posts.findIndex(p => p.featured === true);
  const idx = featIdx >= 0 ? featIdx : 0;
  const featured = posts[idx];

  // last 3 posts excluding the featured
  const latest = posts.filter((_, i) => i !== idx).slice(0, 3);

  renderFeatured(featured);
  renderLatest(latest);
}

function hrefFor(p) {
  // Prefer the new slug-based route; fall back to legacy p.url if present
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

document.addEventListener("DOMContentLoaded", renderFeed);
