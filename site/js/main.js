/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);

const state = {
  projects: [],
  query: "",
  tag: "All",
};

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- filtering ---------- */
function projectMatches(p) {
  const q = state.query.trim().toLowerCase();
  const matchesQuery =
    !q ||
    (p.title || "").toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q) ||
    (p.aws || []).join(" ").toLowerCase().includes(q) ||
    (p.tags || []).join(" ").toLowerCase().includes(q);

  const matchesTag =
    state.tag === "All" || (p.tags || []).includes(state.tag);

  return matchesQuery && matchesTag;
}

/* ---------- render ---------- */
function renderTagFilter() {
  const el = $("#tagFilter");
  if (!el) return;

  const tags = new Set(["All"]);
  state.projects.forEach((p) => (p.tags || []).forEach((t) => tags.add(t)));

  el.innerHTML = [...tags]
    .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
    .join("");
}

function renderProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  const filtered = state.projects.filter(projectMatches);

  grid.innerHTML = filtered
    .map((p) => {
      const tags = (p.tags || [])
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join("");

      const links = [
        p.links?.github
          ? `<a class="btn btn-ghost" href="${p.links.github}" target="_blank" rel="noreferrer">GitHub</a>`
          : "",
        p.links?.live
          ? `<a class="btn" href="${p.links.live}" target="_blank" rel="noreferrer">Live</a>`
          : "",
        p.links?.writeup
          ? `<a class="btn btn-ghost" href="${p.links.writeup}" target="_blank" rel="noreferrer">Case Study</a>`
          : "",
        p.links?.["build guide"]
          ? `<a class="btn btn-ghost" href="${p.links["build guide"]}">Build Guide</a>`
          : "",
      ].join("");

      const pageHref = (p.page && String(p.page).trim()) ? String(p.page).trim() : "";
      const clickableAttrs = pageHref
        ? ` data-href="${pageHref}" tabindex="0" role="link" aria-label="Open ${escapeHtml(p.title)}"`
        : "";
      const clickableClass = pageHref ? " project-card is-clickable" : "";

      return `
        <article class="card${clickableClass}"${clickableAttrs}>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.description)}</p>

          <div class="tags">${tags}</div>

          <div class="muted" style="margin-bottom:12px;">
            <strong>Focus:</strong> ${escapeHtml((p.focus || []).join(", ") || "—")}
            <br />
            <strong>AWS:</strong> ${escapeHtml((p.aws || []).join(", ") || "—")}
          </div>

          <div class="card-actions">${links}</div>
        </article>
      `;
    })
    .join("");

  wireProjectCardClicks();
  $("#projectCount").textContent = String(state.projects.length);
}

function wireProjectCardClicks() {
  document.querySelectorAll(".project-card.is-clickable").forEach((card) => {
    const href = card.getAttribute("data-href");
    if (!href) return;

    const go = () => {
      window.location.href = href;
    };

    card.addEventListener("click", (e) => {
      // allow clicks on buttons/links inside the card
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

/* ---------- init ---------- */
async function init() {
  try {
    const res = await fetch("data/projects.json");
    state.projects = await res.json();

    renderTagFilter();
    renderProjects();

    // Search input
    const search = $("#search");
    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value;
        renderProjects();
      });
    }

    // Tag dropdown
    const tagFilter = $("#tagFilter");
    if (tagFilter) {
      tagFilter.addEventListener("change", () => {
        state.tag = tagFilter.value;
        renderProjects();
      });
    }
  } catch (err) {
    console.error("Failed to load projects:", err);
  }
}

init();
