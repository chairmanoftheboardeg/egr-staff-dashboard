import { supabase } from "./supabaseClient.js";

const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const viewEl = document.getElementById("view");
const whoEl = document.getElementById("who");
const logoutBtn = document.getElementById("logout");

async function init() {
  titleEl.textContent = "Loading…";

  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session) {
    // If not logged in, force back to login
    window.location.replace("../");
    return;
  }

  const user = session.user;

  whoEl.textContent = user.email || user.id;
  titleEl.textContent = "Signed in";
  subtitleEl.textContent = "Session gate is working.";

  viewEl.innerHTML = `
    <div style="font-weight:700; margin-bottom:8px;">Session details</div>
    <div class="small">User ID</div>
    <div style="margin-bottom:10px;">${user.id}</div>
    <div class="small">Email</div>
    <div>${user.email ?? "(none)"}</div>
  `;
}

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.replace("../");
});

init().catch((err) => {
  titleEl.textContent = "Error";
  subtitleEl.textContent = "";
  viewEl.textContent = err?.message || String(err);
});
