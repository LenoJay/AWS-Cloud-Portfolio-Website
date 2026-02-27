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

  const btn = $("#themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const current = document.body.dataset.theme || "dark";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toArray(x) {
  if (Array.isArray(x)) return x;
  if (x == null) return [];
  return [String(x)];
}

function nonEmptyUrl(url) {
  const u = String(url ?? "").trim();
  return u.length ? u : "";
}

function uniqTags(projects) {
  const set = new Set();
  projects.forEach((p) => {
    toArray(p.tags).forEach((t) => set.add(t));
  });
  return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

function renderFilters(tagItems) {
  const wrap = $("#filters");
  if (!wrap) return;

  wrap.innerHTML = "";
  tagItems.forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.textContent = tag;
    btn.setAttribute("aria-pressed", tag === state.activeTag ? "true" : "false");
    btn.addEventListener("click", () => {
      state.activeTag = tag;
      renderFilters(tagItems);
      renderProjects();
    });
    wrap.appendChild(btn);
  });
}

function projectMatches(p) {
  if (state.activeTag === "All") return true;
  return toArray(p.tags).includes(state.activeTag);
}

function wireProjectCardClicks() {
  document.querySelectorAll(".project-card.is-clickable").forEach((card) => {
    const href = card.getAttribute("data-href");
    if (!href) return;

    const go = () => (window.location.href = href);

    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      go();
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });
}

function actionBtn({ label, href, primary = false }) {
  const url = nonEmptyUrl(href);
  const cls = primary ? "btn" : "btn btn-ghost";
  if (!url) {
    // Keep layout consistent even when a link doesn't exist.
    return `<span class="${cls} is-disabled" aria-disabled="true" title="Not available">${escapeHtml(label)}</span>`;
  }
  return `<a class="${cls}" href="${escapeHtml(url)}"${url.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${escapeHtml(label)}</a>`;
}

function renderProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  const filtered = state.projects.filter(projectMatches);

  grid.innerHTML = filtered
    .map((p) => {
      const title = p.title ?? "Untitled Project";
      const summary = p.summary ?? p.description ?? "";
      const tags = toArray(p.tags).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");

      const tools = (toArray(p.tools).length ? toArray(p.tools) : toArray(p.aws))
        .map((t) => `<span class="tool">${escapeHtml(t)}</span>`)
        .join("");

      const focusText = toArray(p.focus).join(", ") || "—";
      const status = p.status ? `<span class="status" data-status="${escapeHtml(p.status)}">${escapeHtml(p.status)}</span>` : "";

      const caseStudy = nonEmptyUrl(p.links?.caseStudy || p.page);
      const github = nonEmptyUrl(p.links?.github);
      const live = nonEmptyUrl(p.links?.live);
      const blog = nonEmptyUrl(p.links?.blog);

      const isClickable = Boolean(caseStudy);

      const actions = [
        actionBtn({ label: "Case Study", href: caseStudy, primary: true }),
        actionBtn({ label: "GitHub", href: github }),
        actionBtn({ label: "Live", href: live }),
        actionBtn({ label: "Blog", href: blog }),
      ].join("");

      const attrs = isClickable
        ? `class="card project-card is-clickable" data-href="${escapeHtml(caseStudy)}" tabindex="0" role="link" aria-label="Open case study: ${escapeHtml(title)}"`
        : `class="card project-card"`;

      return `
        <article ${attrs}>
          <div class="project-head">
            <h3>${escapeHtml(title)}</h3>
            ${status}
          </div>

          <p>${escapeHtml(summary)}</p>

          <div class="tags">${tags}</div>

          <div class="meta">
            <div><strong>Focus:</strong> ${escapeHtml(focusText)}</div>
            <div class="tools">
              <strong>Tools:</strong>
              <div class="tools-chips">${tools || "<span class='muted'>—</span>"}</div>
            </div>
          </div>

          <div class="card-actions">${actions}</div>
        </article>
      `;
    })
    .join("");

  const count = $("#projectCount");
  if (count) count.textContent = String(state.projects.length);

  wireProjectCardClicks();
}

function initRevealAnimations() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((e) => e.classList.add("in-view"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("in-view")),
    { threshold: 0.12 }
  );

  els.forEach((e) => io.observe(e));
}

async function loadProjects() {
  const res = await fetch("data/projects.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load projects.json (${res.status})`);
  return await res.json();
}

function initMeta() {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

(async function main() {
  initTheme();
  initMeta();
  initRevealAnimations();

  try {
    state.projects = await loadProjects();
    renderFilters(uniqTags(state.projects));
    renderProjects();
  } catch (e) {
    console.error(e);
    const grid = $("#projectsGrid");
    if (grid) {
      grid.innerHTML = `<div class="card"><h3>Error</h3><p>Could not load <code>data/projects.json</code>. Check that it is valid JSON.</p></div>`;
    }
  }
})();