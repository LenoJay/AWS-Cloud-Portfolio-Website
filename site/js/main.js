const $ = (sel) => document.querySelector(sel);

const state = {
  activeFocus: "All",
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

function uniqFocus(projects) {
  const set = new Set();
  projects.forEach((p) => {
    toArray(p.focus).forEach((f) => set.add(f));
  });
  return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

function renderFilters(focusItems) {
  const wrap = $("#filters");
  if (!wrap) return;

  wrap.innerHTML = "";
  focusItems.forEach((f) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.textContent = f;
    btn.setAttribute("aria-pressed", f === state.activeFocus ? "true" : "false");
    btn.addEventListener("click", () => {
      state.activeFocus = f;
      renderFilters(focusItems);
      renderProjects();
    });
    wrap.appendChild(btn);
  });
}

function projectMatches(p) {
  if (state.activeFocus === "All") return true;
  return toArray(p.focus).includes(state.activeFocus);
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

function renderProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  const filtered = state.projects.filter(projectMatches);

  grid.innerHTML = filtered
    .map((p) => {
      const tags = toArray(p.tags).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      const focusText = toArray(p.focus).join(", ") || "—";
      const awsText = toArray(p.aws).join(", ") || "—";

      const pageHref = (p.page || p.links?.["build guide"] || p.links?.writeup || "").trim();
      const isClickable = Boolean(pageHref);

      const actions = [
        p.links?.github
          ? `<a class="btn btn-ghost" href="${escapeHtml(p.links.github)}" target="_blank" rel="noreferrer">GitHub</a>`
          : "",
        p.links?.live
          ? `<a class="btn" href="${escapeHtml(p.links.live)}" target="_blank" rel="noreferrer">Live</a>`
          : "",
        pageHref
          ? `<a class="btn btn-ghost" href="${escapeHtml(pageHref)}">Case Study</a>`
          : "",
      ].join("");

      const attrs = isClickable
        ? `class="card project-card is-clickable" data-href="${escapeHtml(pageHref)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(p.title)}"`
        : `class="card"`;

      return `
        <article ${attrs}>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.description)}</p>

          <div class="tags">${tags}</div>

          <div class="muted" style="margin-bottom:12px;">
            <strong>Focus:</strong> ${escapeHtml(focusText)}<br/>
            <strong>AWS:</strong> ${escapeHtml(awsText)}
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
    renderFilters(uniqFocus(state.projects));
    renderProjects();
  } catch (e) {
    console.error(e);
    const grid = $("#projectsGrid");
    if (grid) {
      grid.innerHTML = `<div class="card"><h3>Error</h3><p>Could not load <code>data/projects.json</code>. Check that it is valid JSON.</p></div>`;
    }
  }
})();