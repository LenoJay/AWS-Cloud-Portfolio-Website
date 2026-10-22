const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
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

/* ---------- Hero intro (GSAP, runs once, under 2.5 s) ---------- */
function heroIntro() {
  const root = document.documentElement;
  const hero = $(".hero-inner");
  if (!hero || !window.gsap || reduceMotion) {
    root.classList.remove("motion");
    return;
  }

  const typed = hero.querySelector(".hero-typed");
  const name = hero.querySelector(".hero-name");
  const last = hero.querySelector(".hero-last");
  const command = typed.textContent;

  // Screen readers get the full name; the letters are split only for the animation
  name.setAttribute("aria-label", name.textContent);
  last.innerHTML = [...last.textContent].map((ch) => `<span>${escapeHtml(ch)}</span>`).join("");
  typed.textContent = "";

  const chars = { n: 0 };
  gsap.timeline({ defaults: { ease: "power2.out" } })
    .to(chars, {
      n: command.length,
      duration: 0.6,
      ease: "none",
      onUpdate: () => { typed.textContent = command.slice(0, Math.round(chars.n)); },
    })
    .from(".hero-first", { autoAlpha: 0, y: 24, duration: 0.35 })
    .from(last.children, { autoAlpha: 0, y: 12, duration: 0.22, stagger: 0.03 }, "-=0.15")
    .from([".hero-role", ".hero-intro"], { autoAlpha: 0, y: 10, duration: 0.3, stagger: 0.08 }, "-=0.1")
    .from(".hero-kv", { autoAlpha: 0, duration: 0.15 }, "-=0.1")
    .from(".hero-kv > div", { autoAlpha: 0, x: -8, duration: 0.18, stagger: 0.07 })
    .from(".hero-actions .btn", { autoAlpha: 0, y: 8, duration: 0.28, stagger: 0.05 }, "-=0.05");

  // The from() tweens have already set their start states, so the hero can be un-hidden now
  root.classList.remove("motion");
}

/* ---------- Hero background: Vanta NET (desktop and motion on only) ---------- */
function loadScript(src, integrity) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.integrity = integrity;
    s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function heroBackground() {
  const el = $("#heroBg");
  if (!el || reduceMotion || !window.matchMedia("(min-width: 768px)").matches) return;

  try {
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js",
      "sha384-9EQoUIJYrv09/oYhSxnw1VpLcfPw3BM9dE7+D/3wGUPeLLa7F9Z6OAoD+i/M6FK9"
    );
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.net.min.js",
      "sha384-L0sjdcIWJ156WmvbxIBHx79j1WrCqANCyw456nl/aPWSYiHNywEU2VIAcbSJeIiX"
    );
  } catch {
    return; // keep the static SVG network
  }

  // Only render while the hero is on screen, to save battery and CPU
  let effect = null;
  const start = () => {
    if (effect) return;
    effect = window.VANTA.NET({
      el,
      mouseControls: true,
      touchControls: false,
      gyroControls: false,
      color: 0xb5f23d,
      backgroundColor: 0x0e1110,
      points: 8,
      maxDistance: 18,
      spacing: 18,
      showDots: true,
    });
    el.classList.add("is-live");
  };
  const stop = () => {
    if (effect) effect.destroy();
    effect = null;
  };
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(el);
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
  if (aboutName) aboutName.textContent = p.name || "Leno Jovicevic";

  const heroTitle = $("#heroTitle");
  if (heroTitle) heroTitle.textContent = (p.specializations || []).slice(0, 3).join(" • ") || "AWS • DevOps • Cloud";

  const keywordChips = $("#keywordChips");
  if (keywordChips) {
    keywordChips.innerHTML = (p.specializations || []).map((k) => `<span class="tag">${escapeHtml(k)}</span>`).join("");
  }

  const badges = $("#aboutBadges");
  if (badges) {
    badges.innerHTML = (p.highlight_keywords || []).slice(0, 10).map((k) => `<span class="tag tag-tool">${escapeHtml(k)}</span>`).join("");
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
function statusPill(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("live")) return `<span class="pill pill-live">● live</span>`;
  if (s.includes("progress")) return `<span class="pill pill-progress">● in progress</span>`;
  if (s.includes("plan")) return `<span class="pill pill-planned">○ planned</span>`;
  return s ? `<span class="pill">${escapeHtml(s)}</span>` : "";
}

// Arrow between diagram boxes; its dashes move so data visibly flows
const FLOW_ARROW = `<svg class="dg-arrow" viewBox="0 0 26 10" aria-hidden="true" focusable="false"><path class="dg-line" d="M1 5H20"/><path class="dg-head" d="M18 1.5 23 5l-5 3.5"/></svg>`;

// Schema: { label, rows: [{ nodes: [...], note }], highlight: [...], dashed: [...], planned }
function renderDiagram(d) {
  if (!d || !Array.isArray(d.rows)) return "";
  const hl = new Set(toArray(d.highlight));
  const dashed = new Set(toArray(d.dashed));
  const rows = d.rows
    .map((r) => {
      // Each arrow is kept together with the box it points to, so a wrapped row never strands an arrow
      const nodes = toArray(r.nodes).map((n, i) => {
        const cls = ["dg-node", hl.has(n) ? "is-hl" : "", dashed.has(n) ? "is-dashed" : ""].join(" ").trim();
        const box = `<span class="${cls}">${escapeHtml(n)}</span>`;
        return i === 0 ? box : `<span class="dg-step">${FLOW_ARROW}${box}</span>`;
      });
      const note = r.note ? `<span class="dg-step">${FLOW_ARROW}<span class="dg-note">${escapeHtml(r.note)}</span></span>` : "";
      return `<div class="dg-row">${nodes.join("")}${note}</div>`;
    })
    .join("");
  return `<div class="dg${d.planned ? " is-planned" : ""}" role="img" aria-label="${escapeHtml(d.label || "")}">${rows}</div>`;
}

function renderProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  grid.innerHTML = state.projects
    .map((p) => {
      const tools = toArray(p.tools).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      const caseStudyHref = (p.links?.caseStudy || "").trim();
      const planned = String(p.status || "").toLowerCase().includes("plan");

      // The case-study link stretches over the whole card; GitHub, Live and Blog stay separate buttons
      const more = caseStudyHref
        ? `<a class="pc-link" href="${escapeHtml(caseStudyHref)}" aria-label="${planned ? "See the plan" : "Read case study"}: ${escapeHtml(p.title)}">${planned ? "see the plan" : "read case study"} →</a>`
        : "";
      const buttons = [
        ["GitHub", p.links?.github],
        ["Live", p.links?.live],
        ["Blog", p.links?.blog],
      ]
        .filter(([, href]) => (href || "").trim())
        .map(([label, href]) => makeAction(label, href.trim(), "ghost"))
        .join("");

      return `
        <article class="project-card">
          <div class="pc-cover">${renderDiagram(p.diagram)}</div>
          <div class="pc-body">
            <div class="pc-head">
              <h3>${escapeHtml(p.title)}</h3>
              ${statusPill(p.status)}
            </div>
            <p class="pc-text">${escapeHtml(p.overview || "")}</p>
            <div class="tags">${tools}</div>
            <div class="pc-foot">
              ${more}
              <div class="pc-buttons">${buttons}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

/* ---------- Skills (chips, no percentages) ---------- */
// Simple Icons, pinned. It has GitHub/Git/OpenID logos but no AWS logos, so AWS chips use a lettered tile.
const ICON_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@16.33.0/icons/";

function skillTile(it) {
  if (it.icon && /^[a-z0-9]+$/.test(it.icon)) {
    return `<span class="skill-ico has-logo" style="--logo: url('${ICON_CDN}${it.icon}.svg')" aria-hidden="true"></span>`;
  }
  const short = it.short || it.name.slice(0, 2).toUpperCase();
  return `<span class="skill-ico" aria-hidden="true">${escapeHtml(short)}</span>`;
}

function renderSkills() {
  const wrap = $("#skillsTree");
  if (!wrap) return;

  // Schema: [{ group: "...", items: [{ name, short } | { name, icon } | "name"] }, ...]
  wrap.innerHTML = (state.skills || [])
    .map((g) => {
      // "(roadmap)" skills are shown dashed, so it's clear they're not claimed yet
      const groupRoadmap = /roadmap/i.test(g.group || "");
      const chips = toArray(g.items)
        .map((raw) => (typeof raw === "string" ? { name: raw } : raw))
        .map((it) => {
          const roadmap = groupRoadmap || /roadmap/i.test(it.name) ? " is-roadmap" : "";
          return `<li class="skill-chip${roadmap}">${skillTile(it)}${escapeHtml(it.name)}</li>`;
        })
        .join("");
      return `
        <div class="skill-card">
          <h3>${escapeHtml(g.group || "Skills")}</h3>
          <ul class="skill-chips">${chips}</ul>
        </div>
      `;
    })
    .join("");
}

// Soft lime spotlight that follows the cursor inside each skill card (mouse only, motion on)
function initSpotlight() {
  const wrap = $("#skillsTree");
  if (!wrap || reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  wrap.addEventListener("pointermove", (e) => {
    const card = e.target.closest(".skill-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--x", `${e.clientX - r.left}px`);
    card.style.setProperty("--y", `${e.clientY - r.top}px`);
  });
}

/* ---------- Certifications ---------- */
function renderCerts() {
  const wrap = $("#certGrid");
  if (!wrap) return;

  wrap.innerHTML = (state.certs || [])
    .map((c) => {
      const verifyHref = (c.verify || "").trim();
      const topRight = `<span class="status ${String(c.status || "").toLowerCase().includes("verify") ? "status-live" : ""}">${escapeHtml(c.status || "")}</span>`;
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
  heroIntro();
  heroBackground();
  initSpotlight();
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
    renderProjects();
    renderSkills();
    renderCerts();
    renderBlog("blogGrid");
  } catch (e) {
    console.error(e);
  }
})();