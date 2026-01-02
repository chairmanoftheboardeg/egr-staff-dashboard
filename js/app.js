import { supabase } from "./supabaseClient.js";
import { renderProfile } from "./modules/profile.js";
import { renderTickets } from "./modules/tickets.js";

const navEl = document.getElementById("nav");
const viewEl = document.getElementById("view");
const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const whoEl = document.getElementById("who");
const badgesEl = document.getElementById("badges");
const logoutBtn = document.getElementById("logout");

function setBadges(items) {
  badgesEl.innerHTML = "";
  for (const t of items) {
    const b = document.createElement("div");
    b.className = "badge";
    b.textContent = t;
    badgesEl.appendChild(b);
  }
}

function hasAny(permsSet, required = []) {
  if (!required.length) return true;
  return required.some(p => permsSet.has(p));
}

function buildNav(permsSet, modules) {
  navEl.innerHTML = "";
  for (const m of modules) {
    if (!hasAny(permsSet, m.perms)) continue;
    const a = document.createElement("a");
    a.href = `#${m.key}`;
    a.textContent = m.label;
    navEl.appendChild(a);
  }
}

function setActive(hash) {
  [...navEl.querySelectorAll("a")].forEach(a =>
    a.classList.toggle("active", a.getAttribute("href") === hash)
  );
}

const MODULES = [
  { key: "profile", label: "My Profile", perms: [], render: renderProfile },

  // Tickets (department queues + claim flow)
  { key: "tickets", label: "Tickets Queue", perms: ["support.tickets.read"], render: renderTickets },

  // Placeholders (we implement next)
  { key: "flights", label: "Flights (OCC)", perms: ["occ.flights.manage", "flights.manage"], render: async () => `<div class="small">Next module to implement: OCC flight management.</div>` },
  { key: "careers", label: "Recruitment (HR)", perms: ["hr.applications.read"], render: async () => `<div class="small">Next module to implement: HR recruitment pipeline.</div>` },
  { key: "cms", label: "CMS Content", perms: ["cms.manage", "content.news.manage"], render: async () => `<div class="small">Next module to implement: News/Events/Leadership/Media.</div>` },
  { key: "university", label: "University", perms: ["uni.applications.read"], render: async () => `<div class="small">Next module to implement: admissions + students + courses.</div>` },
  { key: "alliance", label: "Alliance", perms: ["alliance.manage"], render: async () => `<div class="small">Next module to implement: alliance apps + directory.</div>` },
  { key: "legal", label: "Legal & Compliance", perms: ["legal.incidents.read"], render: async () => `<div class="small">Next module to implement: incidents + deletion requests + audits.</div>` },
];

async function fetchContext() {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess?.session) return null;

  const { data, error } = await supabase.rpc("my_staff_context");
  if (error) throw error;

  if (!data?.is_staff) return { isStaff: false };

  const perms = new Set((data.perms ?? []).map(String));
  return { isStaff: true, staff: data.staff, perms };
}

async function route(ctx) {
  const hash = (window.location.hash || "#profile");
  setActive(hash);

  const key = hash.replace("#", "");
  const mod = MODULES.find(m => m.key === key) || MODULES[0];

  if (!hasAny(ctx.perms, mod.perms)) {
    titleEl.textContent = "Access denied";
    subtitleEl.textContent = "You do not have permission to view this module.";
    viewEl.innerHTML = `<div class="small">Contact HR/Admin if this is incorrect.</div>`;
    return;
  }

  titleEl.textContent = mod.label;
  subtitleEl.textContent = `Dept: ${ctx.staff.department_code} • Status: ${ctx.staff.status}`;

  const out = await mod.render({ supabase, ctx });
  viewEl.innerHTML = typeof out === "string" ? out : "";
}

async function init() {
  titleEl.textContent = "Loading…";
  subtitleEl.textContent = "";
  viewEl.textContent = "Initialising…";

  const ctx = await fetchContext();

  if (!ctx) {
    window.location.replace("../");
    return;
  }

  if (!ctx.isStaff) {
    await supabase.auth.signOut();
    window.location.replace("../");
    return;
  }

  whoEl.textContent = `${ctx.staff.full_name}`;
  setBadges([
    `Dept: ${ctx.staff.department_code}`,
    `Perms: ${ctx.perms.size}`,
  ]);

  buildNav(ctx.perms, MODULES);

  window.addEventListener("hashchange", () => route(ctx));
  await route(ctx);
}

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.replace("../");
});

init().catch(err => {
  titleEl.textContent = "Error";
  subtitleEl.textContent = "";
  viewEl.textContent = err?.message || String(err);
});
