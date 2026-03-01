const $ = (sel) => document.querySelector(sel);

const state = {
  activeTag: "All",
  activeExp: "All",
  data: {
    projects: [],
    kpis: [],
    capabilities: [],
    skills: [],
    certs: [],
    experience: [],
  }
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
  if (saved === "light" || saved === "dark") applyTheme(saved);
  else applyTheme(prefersLight() ? "light" : "dark");

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

function makeAction(label, href, kind) {
  const cls = kind === "primary" ? "btn" : "btn btn-ghost";
  if (!href) return `<span class="${cls} is-disabled" aria-disabled="true">${escapeHtml(label)}</span>`;
  const isExternal = /^https?:\/\//i.test(href);
  const extra = isExternal ? ` target="_blank" rel="noreferrer"` : "";
  return `<a class="${cls}" href="${escapeHtml(href)}"${extra}>${escapeHtml(label)}</a>`;
}

/* ---------- Projects (Hasan-style filters + consistent buttons) ---------- */
function uniqTags(projects) {
  const set = new Set();
  projects.forEach((p) => toArray(p.tags).forEach((t) => set.add(t)));
  return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}
function renderProjectFilters(tags) {
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
      renderProjectFilters(tags);
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

  const projects = state.data.projects
    .slice()
    .sort((a, b) => (b.featured === true) - (a.featured === true) || a.title.localeCompare(b.title));

  const filtered = projects.filter(projectMatches);

  grid.innerHTML = filtered
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

  const count = $("#projectCount");
  if (count) count.textContent = String(state.data.projects.length);

  wireProjectCardClicks();
}

/* ---------- KPI strip (Sai/Binyam-style) ---------- */
function renderKpis() {
  const wrap = $("#kpiGrid");
  if (!wrap) return;

  wrap.innerHTML = (state.data.kpis || [])
    .map((k) => `
      <div class="kpi">
        <div class="kpi-top">
          <div class="kpi-label">${escapeHtml(k.label)}</div>
          <div class="kpi-value">${escapeHtml(k.value)}</div>
        </div>
        <div class="kpi-note">${escapeHtml(k.note || "")}</div>
      </div>
    `)
    .join("");
}

/* ---------- Capabilities grid (Binyam-style) ---------- */
function renderCapabilities() {
  const wrap = $("#capGrid");
  if (!wrap) return;

  wrap.innerHTML = (state.data.capabilities || [])
    .map((c) => {
      const chips = toArray(c.chips).map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join("");
      const bullets = toArray(c.bullets).map((b) => `<li>${escapeHtml(b)}</li>`).join("");
      return `
        <div class="cap">
          <div class="cap-pill">${escapeHtml(c.pill || "Capability")}</div>
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.desc || "")}</p>
          <ul>${bullets}</ul>
          <div class="chips">${chips}</div>
        </div>
      `;
    })
    .join("");
}

/* ---------- Skills tree (Hitesh-style grouping) ---------- */
function renderSkills() {
  const wrap = $("#skillsTree");
  if (!wrap) return;

  wrap.innerHTML = (state.data.skills || [])
    .map((g) => {
      const items = toArray(g.items).map((it) => {
        const lvl = Number(it.level ?? 0);
        return `
          <div class="skill">
            <div class="skill-name">${escapeHtml(it.name)}</div>
            <div class="skill-level">${escapeHtml(String(lvl))}%</div>
            <div class="bar" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, lvl))}%"></span></div>
          </div>
        `;
      }).join("");
      return `
        <div class="skill-group">
          <h3>${escapeHtml(g.domain)}</h3>
          ${items}
        </div>
      `;
    })
    .join("");
}

/* ---------- Certifications (Hitesh-style “official” cards) ---------- */
function renderCerts() {
  const wrap = $("#certGrid");
  if (!wrap) return;

  wrap.innerHTML = (state.data.certs || [])
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

/* ---------- Experience timeline + Details modal (Rolind/Herve style) ---------- */
function uniqExpDomains(items) {
  const set = new Set();
  items.forEach((it) => toArray(it.domains).forEach((d) => set.add(d)));
  return ["All", ...Array.from(set).sort((a,b) => a.localeCompare(b))];
}
function renderExpFilters(domains) {
  const wrap = $("#expFilters");
  if (!wrap) return;

  wrap.innerHTML = "";
  domains.forEach((d) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.type = "button";
    btn.textContent = d;
    btn.setAttribute("aria-pressed", d === state.activeExp ? "true" : "false");
    btn.addEventListener("click", () => {
      state.activeExp = d;
      renderExpFilters(domains);
      renderExperience();
    });
    wrap.appendChild(btn);
  });
}
function expMatches(it) {
  if (state.activeExp === "All") return true;
  return toArray(it.domains).includes(state.activeExp);
}

function openModal(title, cmd, html) {
  const modal = $("#modal");
  if (!modal) return;

  $("#modalTitle").textContent = title;
  $("#modalCmd").textContent = cmd || "$ details --open";
  $("#modalBody").innerHTML = html;

  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = $("#modal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  $("#modalBody").innerHTML = "";
}

function wireModal() {
  const modal = $("#modal");
  if (!modal) return;

  modal.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close='true']");
    if (close) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
  });
}

function renderExperience() {
  const wrap = $("#expTimeline");
  if (!wrap) return;

  const items = (state.data.experience || []).filter(expMatches);

  wrap.innerHTML = items.map((it) => {
    const domTags = toArray(it.domains).map((d) => `<span class="tag">${escapeHtml(d)}</span>`).join("");
    const toolTags = toArray(it.tools).map((t) => `<span class="tag tag-tool">${escapeHtml(t)}</span>`).join("");
    const bullets = toArray(it.bullets).map((b) => `<li>${escapeHtml(b)}</li>`).join("");

    const btnId = `details_${Math.random().toString(16).slice(2)}`;

    // Store details in data-* safely by rendering on click (below).
    return `
      <div class="timeline-item">
        <div class="timeline-head">
          <div>
            <h3 class="timeline-title">${escapeHtml(it.title)}</h3>
            <div class="timeline-meta">${escapeHtml(it.role || "")} • ${escapeHtml(it.when || "")}</div>
          </div>
          <button class="btn btn-ghost" type="button" data-details="${escapeHtml(it.title)}">Details</button>
        </div>

        <div class="tags">${domTags}</div>
        <ul>${bullets}</ul>
        <div class="tools-line">${toolTags}</div>
      </div>
    `;
  }).join("");

  // Wire details buttons
  wrap.querySelectorAll("[data-details]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.getAttribute("data-details");
      const it = (state.data.experience || []).find((x) => x.title === title);
      if (!it) return;

      const resp = toArray(it.details?.["Responsibilities"]).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
      const arch = toArray(it.details?.["Architecture highlights"]).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
      const tools = toArray(it.tools).map((t) => `<span class="tag tag-tool">${escapeHtml(t)}</span>`).join("");
      const domains = toArray(it.domains).map((d) => `<span class="tag">${escapeHtml(d)}</span>`).join("");

      const html = `
        <div class="tags">${domains}</div>
        <div class="tools-line" style="margin:10px 0 14px;">${tools}</div>

        <h4>Responsibilities</h4>
        <ul>${resp || "<li>—</li>"}</ul>

        <h4>Architecture highlights</h4>
        <ul>${arch || "<li>—</li>"}</ul>
      `;

      openModal(it.title, "$ details --open --verbose", html);
    });
  });
}

/* ---------- check-health interaction (Sai-like) ---------- */
function initHealthCheck() {
  const btn = $("#healthBtn");
  const panel = $("#healthPanel");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const ok = (label, value, cls) => `
      <div class="health-row">
        <div><strong>${escapeHtml(label)}</strong><div class="muted" style="font-size:12px;">${escapeHtml(value)}</div></div>
        <span class="badge ${cls}">${cls === "ok" ? "OK" : cls === "warn" ? "WARN" : "OFF"}</span>
      </div>
    `;

    // Frontend-only signals (no fake business metrics)
    const hasProjects = Array.isArray(state.data.projects) && state.data.projects.length > 0;
    const hasFilters = $("#filters")?.children?.length > 0;

    panel.innerHTML = [
      ok("Projects loaded", hasProjects ? `${state.data.projects.length} projects` : "No data", hasProjects ? "ok" : "off"),
      ok("Filters ready", hasFilters ? "Tag filters rendered" : "Not rendered", hasFilters ? "ok" : "warn"),
      ok("Theme toggle", $("#themeToggle") ? "Available" : "Missing", $("#themeToggle") ? "ok" : "warn"),
      ok("Case study links", state.data.projects.every(p => (p.links?.caseStudy || "").trim()) ? "All projects have case studies" : "Some missing", state.data.projects.every(p => (p.links?.caseStudy || "").trim()) ? "ok" : "warn"),
    ].join("");

    panel.hidden = false;
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
  initTheme();
  initMeta();
  initRevealAnimations();
  wireModal();

  try {
    const [projects, kpis, caps, skills, certs, exp] = await Promise.all([
      loadJson("/data/projects.json"),
      loadJson("/data/kpis.json"),
      loadJson("/data/capabilities.json"),
      loadJson("/data/skills.json"),
      loadJson("/data/certs.json"),
      loadJson("/data/experience.json"),
    ]);

    state.data.projects = projects;
    state.data.kpis = kpis;
    state.data.capabilities = caps;
    state.data.skills = skills;
    state.data.certs = certs;
    state.data.experience = exp;

    renderKpis();
    renderCapabilities();

    const tags = uniqTags(state.data.projects);
    renderProjectFilters(tags);
    renderProjects();

    const domains = uniqExpDomains(state.data.experience);
    renderExpFilters(domains);
    renderExperience();

    renderSkills();
    renderCerts();

    initHealthCheck();
  } catch (e) {
    console.error(e);
  }
})();