import { supabase } from "./supabaseClient.js";

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const msgEl = document.getElementById("msg");
const btn = document.getElementById("loginBtn");

function setMsg(text) {
  msgEl.textContent = text;
}

async function doLogin() {
  const email = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) {
    setMsg("Enter email and password.");
    return;
  }

  btn.disabled = true;
  setMsg("Signing in...");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  btn.disabled = false;

  if (error) {
    setMsg(`Login failed: ${error.message}`);
    return;
  }

  if (data?.session) {
    window.location.replace("./app/");
  } else {
    setMsg("No session returned. Check Supabase Auth settings.");
  }
}

btn.addEventListener("click", doLogin);
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});

// Auto redirect if already logged in
const { data: sessionData } = await supabase.auth.getSession();
if (sessionData?.session) window.location.replace("./app/");
