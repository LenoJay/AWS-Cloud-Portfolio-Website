const $ = (sel) => document.querySelector(sel);

const state = {
  activeTag: "All",
  projects: [],
  skills: [],
  certs: [],
  blog: [],
  profile: null,
};

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

function makeAction(label, href, kind, iconSvg) {
  const clsBase = kind === "primary" ? "btn" : "btn btn-ghost";
  const cls = iconSvg ? `${clsBase} btn-icon` : clsBase;

  if (!href) return `<span class="${cls} is-disabled" aria-disabled="true">${escapeHtml(label)}</span>`;

  const isExternal = /^https?:\/\//i.test(href);
  const extra = isExternal ? ` target="_blank" rel="noreferrer"` : "";
  return `<a class="${cls}" href="${escapeHtml(href)}"${extra}>${iconSvg || ""}${escapeHtml(label)}</a>`;
}

function svgGitHub() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .5C5.73.5.75 5.67.75 12.07c0 5.14 3.28 9.5 7.83 11.04.57.11.78-.25.78-.55v-2.02c-3.19.71-3.86-1.39-3.86-1.39-.52-1.36-1.27-1.72-1.27-1.72-1.04-.73.08-.72.08-.72 1.15.08 1.76 1.21 1.76 1.21 1.02 1.79 2.67 1.27 3.32.97.1-.76.4-1.27.73-1.56-2.55-.3-5.23-1.31-5.23-5.82 0-1.29.45-2.34 1.19-3.17-.12-.3-.52-1.52.11-3.17 0 0 .97-.32 3.18 1.21.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.53 3.17-1.21 3.17-1.21.64 1.65.24 2.87.12 3.17.74.83 1.19 1.88 1.19 3.17 0 4.52-2.68 5.52-5.24 5.81.41.36.78 1.08.78 2.18v3.23c0 .31.2.67.79.55 4.55-1.54 7.83-5.9 7.83-11.04C23.25 5.67 18.27.5 12 .5z"/></svg>`;
}
function svgLinkedIn() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.98 3.5C3.33 3.5 2 4.85 2 6.52c0 1.64 1.31 2.98 2.94 2.98h.03c1.68 0 2.98-1.34 2.98-2.98C7.95 4.85 6.66 3.5 4.98 3.5zM2.4 21h5.16V9.98H2.4V21zM9.26 9.98V21h5.16v-6.15c0-3.29 4.27-3.56 4.27 0V21H24v-7.93c0-6.18-6.65-5.95-8.58-2.91V9.98H9.26z"/></svg>`;
}
function svgMail() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
}
function svgBook() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18 2H8C6.9 2 6 2.9 6 4v16c0 1.1.9 2 2 2h10v-2H8V4h10v6h2V4c0-1.1-.9-2-2-2z"/><path fill="currentColor" d="M11 6h6v2h-6V6zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z"/></svg>`;
}

function renderProfile() {
  const p = state.profile;
  if (!p) return;

  const aboutName = $("#aboutName");
  if (aboutName) aboutName.textContent = p.name || "Lenkov";

  const heroTitle = $("#heroTitle");
  if (heroTitle) heroTitle.textContent = (p.specializations || []).slice(0,3).join(" • ") || "AWS • DevOps • Cloud";

  const keywordChips = $("#keywordChips");
  if (keywordChips) {
    keywordChips.innerHTML = (p.specializations || []).map((k) => `<span class="tag">${escapeHtml(k)}</span>`).join("");
  }

  const badges = $("#aboutBadges");
  if (badges) {
    badges.innerHTML = (p.highlight_keywords || []).slice(0,8).map((k) => `<span class="tag tag-tool">${escapeHtml(k)}</span>`).join("");
  }

  const social = $("#socialButtons");
  const mailHref = p.email ? `mailto:${p.email}` : "";
  if (social) {
    social.innerHTML = [
      makeAction("GitHub", p.github, "primary", svgGitHub()),
      makeAction("LinkedIn", p.linkedin, "ghost", svgLinkedIn()),
      makeAction("Blog", p.blog_home, "ghost", svgBook()),
      makeAction("Email", mailHref, "ghost", svgMail()),
    ].join("");
  }

  const contact = $("#contactButtons");
  if (contact) {
    contact.innerHTML = [
      makeAction("Email", mailHref, "primary", svgMail()),
      makeAction("LinkedIn", p.linkedin, "ghost", svgLinkedIn()),
      makeAction("GitHub", p.github, "ghost", svgGitHub()),
      makeAction("Blog", p.blog_home, "ghost", svgBook()),
    ].join("");
  }
}

/* ---------- Projects ---------- */
function uniqTags(projects) {
  const set = new Set();
  projects.forEach((p) => toArray(p.tags).forEach((t) => set.add(t)));
  return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}
function renderFilters(tags) {
  const wrap = $("#filters");
  if (!wrap) return;
  wrap.innerHTML = "";
  tags.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.textContent = t;
    btn.setAttribute("aria-pressed", t === state.activeTag ? "true" : "false");
    btn.addEventListener("click", () => {
      state.activeTag = t;
      renderFilters(tags);
      renderProjects();
    });
    wrap.appendChild(btn);
  });
}
function projectMatches(p) {
  if (state.activeTag === "All") return true;
  return toArray(p.tags).includes(state.activeTag);
}
function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("live")) return "status status-live";
  if (s.includes("progress")) return "status status-progress";
  if (s.includes("plan")) return "status status-planned";
  return "status";
}
function renderProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  const items = state.projects.filter(projectMatches);
  grid.innerHTML = items
    .map((p) => {
      const tags = toArray(p.tags).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      const tools = toArray(p.tools).map((t) => `<span class="tag tag-tool">${escapeHtml(t)}</span>`).join("");
      const focusText = toArray(p.focus).join(", ") || "—";

      const caseStudyHref = (p.links?.caseStudy || "").trim();
      const githubHref = (p.links?.github || "").trim();
      const liveHref = (p.links?.live || "").trim();
      const blogHref = (p.links?.blog || "").trim();

      const isClickable = Boolean(caseStudyHref);
      const attrs = isClickable
        ? `class="card project-card is-clickable" data-href="${escapeHtml(caseStudyHref)}" tabindex="0" role="link" aria-label="Open case study: ${escapeHtml(p.title)}"`
        : `class="card project-card"`;

      const actions = [
        makeAction("Case Study", caseStudyHref, "primary"),
        makeAction("GitHub", githubHref, "ghost"),
        makeAction("Live", liveHref, "ghost"),
        makeAction("Blog", blogHref, "ghost"),
      ].join("");

      return `
        <article ${attrs}>
          <div class="project-head">
            <h3>${escapeHtml(p.title)}</h3>
            <span class="${statusClass(p.status)}">${escapeHtml(p.status || "")}</span>
          </div>

          <p class="project-overview">${escapeHtml(p.overview || "")}</p>
          <div class="tags">${tags}</div>

          <div class="project-meta">
            <div><strong>Focus:</strong> ${escapeHtml(focusText)}</div>
            <div class="tools-row">
              <strong>Tools:</strong>
              <div class="tools">${tools || "<span class=\"muted\">—</span>"}</div>
            </div>
          </div>

          <div class="card-actions">${actions}</div>
        </article>
      `;
    })
    .join("");

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

/* ---------- Skills ---------- */
function renderSkills() {
  const wrap = $("#skillsTree");
  if (!wrap) return;

  wrap.innerHTML = (state.skills || [])
    .map((g) => {
      const items = toArray(g.items)
        .map((it) => {
          const lvl = Number(it.level ?? 0);
          return `
            <div class="skill">
              <div class="skill-name">${escapeHtml(it.name)}</div>
              <div class="skill-level">${escapeHtml(String(lvl))}%</div>
              <div class="bar" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, lvl))}%"></span></div>
            </div>
          `;
        })
        .join("");
      return `
        <div class="skill-group">
          <h3>${escapeHtml(g.domain)}</h3>
          ${items}
        </div>
      `;
    })
    .join("");
}

/* ---------- Certifications ---------- */
function renderCerts() {
  const wrap = $("#certGrid");
  if (!wrap) return;

  wrap.innerHTML = (state.certs || [])
    .map((c) => {
      const verifyHref = (c.verify || "").trim();
      const topRight = `<span class="status ${String(c.status||"").toLowerCase().includes("verify") ? "status-live" : ""}">${escapeHtml(c.status || "")}</span>`;
      const actions = makeAction("Verify", verifyHref, "ghost");
      return `
        <div class="cert">
          <div class="cert-top">
            <div>
              <h3 class="cert-name">${escapeHtml(c.name)}</h3>
              <div class="cert-meta">${escapeHtml(c.issuer || "")} • ${escapeHtml(c.year || "")}</div>
            </div>
            ${topRight}
          </div>
          <div class="card-actions" style="margin-top:12px;">
            ${actions}
          </div>
        </div>
      `;
    })
    .join("");
}

/* ---------- Blog ---------- */
function renderBlog(gridId = "blogGrid") {
  const wrap = document.getElementById(gridId);
  if (!wrap) return;

  const posts = (state.blog || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));

  wrap.innerHTML = posts
    .map((p) => {
      const tags = toArray(p.tags).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      return `
        <article class="card blog-card" data-href="${escapeHtml(p.href)}" tabindex="0" role="link" aria-label="Open blog post: ${escapeHtml(p.title)}">
          <div class="blog-top">
            <div class="blog-date">${escapeHtml(p.date || "")}</div>
          </div>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.summary || "")}</p>
          <div class="tags">${tags}</div>
        </article>
      `;
    })
    .join("");

  wrap.querySelectorAll("[data-href]").forEach((card) => {
    const href = card.getAttribute("data-href");
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

/* ---------- Fetch + init ---------- */
async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed ${path} (${res.status})`);
  return await res.json();
}

function initMeta() {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

(async function main() {
  initMeta();
  initRevealAnimations();

  try {
    const [profile, projects, skills, certs, blog] = await Promise.all([
      loadJson("/data/profile.json"),
      loadJson("/data/projects.json"),
      loadJson("/data/skills.json"),
      loadJson("/data/certs.json"),
      loadJson("/data/blog.json"),
    ]);

    state.profile = profile;
    state.projects = projects;
    state.skills = skills;
    state.certs = certs;
    state.blog = blog;

    renderProfile();
    renderFilters(uniqTags(state.projects));
    renderProjects();
    renderSkills();
    renderCerts();
    renderBlog("blogGrid");
  } catch (e) {
    console.error(e);
  }
})();