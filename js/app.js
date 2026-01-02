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

function setActive(hash) {
  [...navEl.querySelectorAll("a")].forEach(a => a.classList.toggle("active", a.getAttribute("href") === hash));
}

function hasAny(perms, required = []) {
  if (!required.length) return true;
  return required.some(p => perms.has(p));
}

async function loadStaffContext(userId) {
  // Staff row (must exist for staff accounts)
  const staffRes = await supabase
    .from("staff")
    .select("user_id, full_name, department_code, role_id, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (staffRes.error) throw staffRes.error;
  if (!staffRes.data) return { isStaff: false };

  // Permissions for the staff role
  const permsRes = await supabase
    .from("role_permissions")
    .select("permission_code")
    .eq("role_id", staffRes.data.role_id);

  if (permsRes.error) throw permsRes.error;

  const perms = new Set((permsRes.data ?? []).map(x => x.permission_code));
  return { isStaff: true, staff: staffRes.data, perms };
}

const MODULES = [
  { key: "profile", label: "My Profile", perms: [], render: renderProfile },

  // Customer Experience / IT / HR queues derive from ticket.department_code as per your spec :contentReference[oaicite:2]{index=2}
  { key: "tickets", label: "Tickets Queue", perms: ["support.tickets.read"], render: renderTickets },

  // Placeholders (we will implement next)
  { key: "flights", label: "Flights (OCC)", perms: ["occ.flights.manage"], render: async () => "Coming next: OCC flight management" },
  { key: "careers", label: "Recruitment (HR)", perms: ["hr.applications.read"], render: async () => "Coming next: HR applications pipeline" },
  { key: "cms", label: "Content (CMS)", perms: ["cms.manage", "content.news.manage"], render: async () => "Coming next: News/Events/Leadership/Media" },
  { key: "university", label: "University", perms: ["uni.applications.read"], render: async () => "Coming next: admissions + students + courses" },
  { key: "alliance", label: "Alliance", perms: ["alliance.manage"], render: async () => "Coming next: alliance applications + directory" },
  { key: "legal", label: "Legal & Compliance", perms: ["legal.incidents.read"], render: async () => "Coming next: incidents + deletion requests + audits" },
];

function buildNav(perms) {
  navEl.innerHTML = "";
  for (const m of MODULES) {
    if (!hasAny(perms, m.perms)) continue;
    const a = document.createElement("a");
    a.href = `#${m.key}`;
    a.textContent = m.label;
    navEl.appendChild(a);
  }
}

async function route(ctx) {
  const hash = (window.location.hash || "#profile").replace("#", "");
  setActive(`#${hash}`);

  const mod = MODULES.find(m => m.key === hash) || MODULES[0];

  if (!hasAny(ctx.perms, mod.perms)) {
    titleEl.textContent = "Access denied";
    subtitleEl.textContent = "You do not have permission to view this module.";
    viewEl.innerHTML = "If you believe this is incorrect, contact HR or Admin.";
    return;
  }

  titleEl.textContent = mod.label;
  subtitleEl.textContent = `Department: ${ctx.staff.department_code} • Status: ${ctx.staff.status}`;
  const out = await mod.render({ supabase, ctx });
  viewEl.innerHTML = typeof out === "string" ? out : "";
}

async function init() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session) {
    window.location.href = "../";
    return;
  }

  const user = session.user;

  const ctx = await loadStaffContext(user.id);
  if (!ctx.isStaff) {
    // Block non-staff accounts from staff dashboard
    await supabase.auth.signOut();
    window.location.href = "../";
    return;
  }

  whoEl.textContent = `${ctx.staff.full_name} (${user.email})`;
  setBadges([
    `Dept: ${ctx.staff.department_code}`,
    `Perms: ${ctx.perms.size}`
  ]);

  buildNav(ctx.perms);

  window.addEventListener("hashchange", () => route(ctx));
  await route(ctx);
}

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "../";
});

init().catch(err => {
  titleEl.textContent = "Error";
  subtitleEl.textContent = "";
  viewEl.textContent = err?.message || String(err);
});
