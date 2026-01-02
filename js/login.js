import { supabase } from "./supabaseClient.js";

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const msgEl = document.getElementById("msg");
const btn = document.getElementById("loginBtn");

btn.addEventListener("click", async () => {
  msgEl.textContent = "Signing in...";
  btn.disabled = true;

  const email = emailEl.value.trim();
  const password = passEl.value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  btn.disabled = false;

  if (error) {
    msgEl.textContent = `Login failed: ${error.message}`;
    return;
  }

  if (data?.session) {
    window.location.href = "./app/";
  }
});

// If already logged in, go to app
const { data: sessionData } = await supabase.auth.getSession();
if (sessionData?.session) window.location.href = "./app/";
