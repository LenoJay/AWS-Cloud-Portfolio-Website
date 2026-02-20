"use strict";

/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);

const state = {
  activeTag: "All",
  projects: [],
};

/* ---------- theme ---------- */
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

/* ---------- reveal animations (makes .reveal visible) ---------- */
function initRevealAnimations() {
  const els = document.querySelectorAll(".reveal");

  // If the browser doesn't support IntersectionObserver, just show everything.
  if (!("IntersectionObserver" in window)) {
    els.forEach((e) => e.classList.add("in-view"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  els.forEach((e) => io.observe(e));

  // Failsafe: after 1.2s, show anything still hidden
  setTimeout(() => {
    document.querySelectorAll(".reveal").forEach((e) => e.classList.add("in-view"));
  }, 1200);
}

/* ---------- safe HTML ---------- */
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- tags + filters ---------- */
function uniqTags(projects) {
  const set = new Set();
  projects.forEach((p) => (p.tags || []).forEach((t) => set.add(String(t))));
  return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

function renderFilters(tags) {
  const wrap = $("#filters");
  if (!wrap) return;

  wrap.innerHTML = "";
  tags.forEach((tag) => {
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

/* ---------- render projects ---------- */
function renderProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  const filtered = state.projects.filter(projectMatches);

  grid.innerHTML = filtered
    .map((p) => {
      const tagsHtml = (p.tags || [])
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join("");

      const focus = Array.isArray(p.focus) ? p.focus.join(", ") : (p.focus || "—");
      const aws = Array.isArray(p.aws) ? p.aws.join(", ") : (p.aws || "—");

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

      const pageHref = p.page ? String(p.page).trim() : "";
      const clickableAttrs = pageHref
        ? ` data-href="${escapeHtml(pageHref)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(p.title)}"`
        : "";
      const clickableClass = pageHref ? " project-card is-clickable" : "";

      return `
        <article class="card${clickableClass}"${clickableAttrs}>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.description)}</p>

          <div class="tags">${tagsHtml}</div>

          <div class="muted" style="margin-bottom:12px;">
            <strong>Focus:</strong> ${escapeHtml(focus)}
            <br />
            <strong>AWS:</strong> ${escapeHtml(aws)}
          </div>

          <div class="card-actions">${links}</div>
        </article>
      `;
    })
    .join("");

  wireProjectCardClicks();

  const count = $("#projectCount");
  if (count) count.textContent = String(filtered.length);
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

/* ---------- init ---------- */
async function initProjectsIfPresent() {
  // Only load JSON if the homepage grid exists
  if (!$("#projectsGrid")) return;

  const res = await fetch("data/projects.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load data/projects.json (${res.status})`);
  state.projects = await res.json();

  const tags = uniqTags(state.projects);
  renderFilters(tags);
  renderProjects();
}

function initMeta() {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

async function init() {
  initTheme();
  initRevealAnimations();
  initMeta();

  try {
    await initProjectsIfPresent();
  } catch (err) {
    console.error(err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}