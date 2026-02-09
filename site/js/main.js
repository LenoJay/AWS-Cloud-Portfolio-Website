const $ = (sel) => document.querySelector(sel);

const state = {
  activeTag: "All",
  projects: [],
};

function prefersLight() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
  } else {
    applyTheme(prefersLight() ? "light" : "dark");
  }

  $("#themeToggle")?.addEventListener("click", () => {
    const current = document.body.dataset.theme || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

function uniqTags(projects) {
  const set = new Set();
  projects.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return ["All", ...Array.from(set).sort((a,b) => a.localeCompare(b))];
}

function renderFilters(tags) {
  const wrap = $("#filters");
  if (!wrap) return;

  wrap.innerHTML = "";
  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.textContent = tag;
    btn.setAttribute("aria-pressed", tag === state.activeTag ? "true" : "false");
    btn.addEventListener("click", () => {
      state.activeTag = tag;
      renderFilters(tags);
      renderProjects();
    });
    wrap.appendChild(btn);
  });
}

function projectMatches(p) {
  if (state.activeTag === "All") return true;
  return (p.tags || []).includes(state.activeTag);
}

function renderProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  const filtered = state.projects.filter(projectMatches);

  grid.innerHTML = filtered.map(p => {
    const tags = (p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
    const links = [
      p.links?.github ? `<a class="btn btn-ghost" href="${p.links.github}" target="_blank" rel="noreferrer">GitHub</a>` : "",
      p.links?.live ? `<a class="btn" href="${p.links.live}" target="_blank" rel="noreferrer">Live</a>` : "",
      p.links?.writeup ? `<a class="btn btn-ghost" href="${p.links.writeup}" target="_blank" rel="noreferrer">Case Study</a>` : ""
    ].join("");

    return `
      <article class="card">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>

        <div class="tags">${tags}</div>

        <div class="muted" style="margin-bottom:12px;">
          <strong>Focus:</strong> ${escapeHtml(p.focus || "—")}
          <br />
          <strong>AWS:</strong> ${escapeHtml((p.aws || []).join(", ") || "—")}
        </div>

        <div class="card-actions">${links}</div>
      </article>
    `;
  }).join("");

  $("#projectCount").textContent = String(state.projects.length);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initRevealAnimations() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(e => e.classList.add("in-view"));
    return;
  }

  // IntersectionObserver is the clean way to do “reveal on scroll”. :contentReference[oaicite:6]{index=6}
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    });
  }, { threshold: 0.12 });

  els.forEach(e => io.observe(e));
}

async function loadProjects() {
  // Using Fetch to load JSON cleanly. :contentReference[oaicite:7]{index=7}
  const res = await fetch("data/projects.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load projects.json (${res.status})`);
  return await res.json();
}

function initMeta() {
  $("#year").textContent = String(new Date().getFullYear());
}

(async function main() {
  initTheme();               // uses prefers-color-scheme concept :contentReference[oaicite:8]{index=8}
  initMeta();
  initRevealAnimations();

  try {
    state.projects = await loadProjects();
    const tags = uniqTags(state.projects);
    renderFilters(tags);
    renderProjects();
  } catch (e) {
    console.error(e);
    const grid = $("#projectsGrid");
    if (grid) grid.innerHTML = `<div class="card"><h3>Error</h3><p>Could not load project data.</p></div>`;
  }
})();
