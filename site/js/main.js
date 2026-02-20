/* main.js — safe version (won’t crash if elements are missing) */

"use strict";

// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- App State ----------
const state = {
  projects: [],
  query: "",
  tag: "all",
};

// ---------- Theme ----------
function initTheme() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const root = document.documentElement;

  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  btn.addEventListener("click", () => {
    const cur = root.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

// ---------- Reveal animations (failsafe so content never stays hidden) ----------
function initReveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (!items.length) return;

  const makeVisible = (el) => el.classList.add("in-view");

  // If IntersectionObserver isn’t available, just show everything.
  if (!("IntersectionObserver" in window)) {
    items.forEach(makeVisible);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          makeVisible(e.target);
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));

  // Failsafe: if anything didn’t get observed properly, show it anyway after a moment.
  setTimeout(() => {
    items.filter((el) => !el.classList.contains("in-view")).forEach(makeVisible);
  }, 1200);
}

// ---------- Data ----------
async function loadProjects() {
  // Works on:
  // - local live server: http://127.0.0.1:5500/site/index.html  -> fetch ./data/projects.json
  // - deployed root:      https://lenojay.com/                  -> fetch ./data/projects.json
  const url = "data/projects.json";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);

  const json = await res.json();
  if (!Array.isArray(json)) throw new Error("projects.json must be an array.");
  return json;
}

// ---------- Filtering ----------
function getAllTags(projects) {
  const tags = new Set();
  for (const p of projects) {
    (p.tags || []).forEach((t) => tags.add(String(t)));
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function applyFilters(projects) {
  const q = state.query.trim().toLowerCase();
  const tag = state.tag;

  return projects.filter((p) => {
    const inTag =
      tag === "all" ||
      (Array.isArray(p.tags) && p.tags.map(String).includes(tag));

    if (!q) return inTag;

    const hay = [
      p.title,
      p.description,
      p.focus,
      ...(p.aws || []),
      ...(p.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    return inTag && hay.includes(q);
  });
}

// ---------- Render: Tag dropdown ----------
function renderTagFilter(projects) {
  const sel = document.getElementById("tagFilter");
  if (!sel) return;

  const tags = getAllTags(projects);

  sel.innerHTML =
    `<option value="all">All tags</option>` +
    tags.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");

  sel.value = state.tag;
}

// ---------- Render: Project cards ----------
function renderProjects(filtered) {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  // ✅ Don’t crash if #projectCount doesn’t exist
  setText("projectCount", filtered.length);

  grid.innerHTML = filtered
    .map((p) => {
      const aws = Array.isArray(p.aws) ? p.aws : [];
      const tags = Array.isArray(p.tags) ? p.tags : [];
      const links = Array.isArray(p.links) ? p.links : [];

      const liveLink = links.find((l) => (l?.label || "").toLowerCase().includes("live"));
      const repoLink = links.find((l) => (l?.label || "").toLowerCase().includes("repo"));
      const blogLink = links.find((l) => (l?.label || "").toLowerCase().includes("blog") || (l?.label || "").toLowerCase().includes("guide"));

      // Choose a primary click target (if you’ve set one in projects.json)
      // If none, we’ll just keep the buttons.
      const primaryHref = p.href || (blogLink?.href ?? "");

      const clickableClass = primaryHref ? " project-card is-clickable" : "";
      const hrefAttr = primaryHref ? ` data-href="${escapeHtml(primaryHref)}"` : "";

      return `
        <article class="card${clickableClass}"${hrefAttr}>
          <div class="card-head">
            <h3>${escapeHtml(p.title)}</h3>
            ${p.focus ? `<span class="chip">${escapeHtml(p.focus)}</span>` : ""}
          </div>

          <p class="muted">${escapeHtml(p.description)}</p>

          ${aws.length ? `<div class="tags">${aws.slice(0, 8).map((a) => `<span class="tag">${escapeHtml(a)}</span>`).join("")}</div>` : ""}

          ${tags.length ? `<div class="tags">${tags.slice(0, 8).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}

          <div class="card-actions">
            ${liveLink ? `<a class="btn btn-primary" href="${escapeHtml(liveLink.href)}" target="_blank" rel="noreferrer">Live</a>` : ""}
            ${repoLink ? `<a class="btn btn-ghost" href="${escapeHtml(repoLink.href)}" target="_blank" rel="noreferrer">Repo</a>` : ""}
            ${blogLink ? `<a class="btn btn-ghost" href="${escapeHtml(blogLink.href)}">Guide</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");

  wireProjectCardClicks();
}

function wireProjectCardClicks() {
  document.querySelectorAll(".project-card.is-clickable").forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", (e) => {
      // Don’t hijack clicks on buttons/links
      if (e.target.closest("a, button")) return;
      const href = card.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  });
}

// ---------- UI Wiring ----------
function initProjectUI() {
  const search = document.getElementById("projectSearch");
  if (search) {
    search.addEventListener("input", (e) => {
      state.query = e.target.value || "";
      renderProjects(applyFilters(state.projects));
    });
  }

  const sel = document.getElementById("tagFilter");
  if (sel) {
    sel.addEventListener("change", (e) => {
      state.tag = e.target.value || "all";
      renderProjects(applyFilters(state.projects));
    });
  }
}

// ---------- Init ----------
async function init() {
  initTheme();
  initReveal();

  // ✅ Don’t crash if #year doesn’t exist
  setText("year", new Date().getFullYear());

  try {
    state.projects = await loadProjects();
    renderTagFilter(state.projects);
    initProjectUI();
    renderProjects(applyFilters(state.projects));
  } catch (err) {
    console.error(err);
    // Optional: show an error message if you have a placeholder element
    const grid = document.getElementById("projectsGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="card">
          <h3>Projects failed to load</h3>
          <p class="muted">Open DevTools → Console to see the error.</p>
        </div>
      `;
    }
  }
}

// Run safely in all cases
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
