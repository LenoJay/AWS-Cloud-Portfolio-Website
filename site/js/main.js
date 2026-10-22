const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  projects: [],
  skills: [],
  certs: [],
  blog: [],
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

/* ---------- Scroll motion (GSAP ScrollTrigger, homepage) ---------- */
function initScrollMotion() {
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return; // content simply stays visible
  gsap.registerPlugin(ScrollTrigger);

  // Each section's "$ command" line types itself out once, when it scrolls into view
  document.querySelectorAll(".section > .cmd").forEach((el) => {
    const text = el.textContent;
    const chars = { n: 0 };
    const show = () => { el.textContent = text.slice(0, Math.round(chars.n)) || " "; };
    show();
    gsap.to(chars, {
      n: text.length,
      duration: Math.min(0.9, text.length * 0.05),
      ease: "none",
      onUpdate: show,
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  // Headings and cards fade up as they arrive, cards in a short stagger
  const items = ".section > h2, .about-text, .project-card, .skill-card, .cert-card, .post-list, .json-block";
  gsap.set(items, { autoAlpha: 0, y: 24 });
  ScrollTrigger.batch(items, {
    start: "top 92%",
    once: true,
    onEnter: (els) =>
      gsap.to(els, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "transform,opacity,visibility", // hand hover effects back to the CSS
      }),
  });
}

/* ---------- Smooth scrolling for in-page links only ---------- */
// Not CSS scroll-behavior: that also animates the jump when a page opens at /#contact,
// and ScrollTrigger interrupts it halfway. Clicks animate; page loads jump straight there.
function initSmoothAnchors() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.getAttribute("href").length < 2) return;
    const target = document.getElementById(link.getAttribute("href").slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    history.pushState(null, "", link.getAttribute("href"));
  });
}

/* ---------- Scroll progress: thin lime bar under the title bar (every page) ---------- */
function initScrollProgress() {
  const header = $(".site-header");
  if (!header) return;
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  header.appendChild(bar);

  let queued = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    queued = false;
  };
  window.addEventListener("scroll", () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
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

function makeAction(label, href, kind) {
  const cls = kind === "primary" ? "btn btn-primary" : "btn btn-ghost";

  if (!href) return `<span class="${cls} is-disabled" aria-disabled="true">${escapeHtml(label)}</span>`;

  const isExternal = /^https?:\/\//i.test(href);
  const extra = isExternal ? ` target="_blank" rel="noreferrer"` : "";
  return `<a class="${cls}" href="${escapeHtml(href)}"${extra}>${escapeHtml(label)}</a>`;
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

/* ---------- Certifications (badge cards) ---------- */
function renderCerts() {
  const wrap = $("#certGrid");
  if (!wrap) return;

  // Schema: [{ name, issuer, year, status, verify, badge }]. Paste a Credly badge image URL into "badge".
  wrap.innerHTML = (state.certs || [])
    .map((c) => {
      const verify = (c.verify || "").trim();
      const badge = (c.badge || "").trim();
      const art = badge
        ? `<img class="cert-img" src="${escapeHtml(badge)}" alt="" width="64" height="64" loading="lazy" />`
        : `<span class="cert-fallback" aria-hidden="true">${escapeHtml(c.issuer || "")}</span>`;
      const meta = [c.year, String(c.status || "").toLowerCase()].filter(Boolean).map(escapeHtml).join(" · ");
      const verifyText = verify ? ` · verify${/credly/i.test(verify) ? " on Credly" : ""} →` : "";
      const body = `${art}<span class="cert-text"><strong>${escapeHtml(c.name)}</strong><span class="cert-meta">${meta}${verifyText}</span></span>`;
      return verify
        ? `<a class="cert-card" href="${escapeHtml(verify)}" target="_blank" rel="noreferrer">${body}</a>`
        : `<div class="cert-card">${body}</div>`;
    })
    .join("");
}

/* ---------- Build notes (the blog as a list) ---------- */
function renderBlog(gridId = "blogGrid") {
  const wrap = document.getElementById(gridId);
  if (!wrap) return;

  // data-limit="3" on the homepage shows the latest three; the blog page shows all
  const limit = Number(wrap.dataset.limit) || Infinity;
  const posts = (state.blog || [])
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);

  wrap.innerHTML = posts
    .map(
      (p) => `
        <a class="post-row" href="${escapeHtml(p.href)}">
          <span class="post-date">${escapeHtml(p.date || "")}</span>
          <span class="post-title">${escapeHtml(p.title)}</span>
          <span class="post-read" aria-hidden="true">read →</span>
        </a>
      `
    )
    .join("");
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
  initSmoothAnchors();
  initScrollProgress();

  try {
    const [projects, skills, certs, blog] = await Promise.all([
      loadJson("/data/projects.json"),
      loadJson("/data/skills.json"),
      loadJson("/data/certs.json"),
      loadJson("/data/blog.json"),
    ]);

    state.projects = projects;
    state.skills = skills;
    state.certs = certs;
    state.blog = blog;

    renderProjects();
    renderSkills();
    renderCerts();
    renderBlog("blogGrid");
  } catch (e) {
    console.error(e);
  }

  // After rendering, so the cards exist; runs even if a JSON file failed
  initScrollMotion();
})();