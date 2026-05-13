import './alert.js'
import { supabase } from "./supabaseclient/supabaseclient.js";

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("createJobBtn");
  if (btn) {
    btn.addEventListener("click", createJob);
  }

  const backBtn = document.getElementById("goDashboardBtn");
  if (backBtn) {
    backBtn.addEventListener("click", goDashboard);
  }

});


// ===============================
// CREAR OFERTA
// ===============================
async function createJob() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const title = document.getElementById("jobTitle").value.trim();
  const description = document.getElementById("jobDescription").value.trim();
  const category = document.getElementById("jobCategory").value;
  const contact_email = document.getElementById("jobEmail").value.trim();

  // validaciones
  if (!title || !description || !contact_email || !category) {
    showToast("completa todos los campos");
    return;
  }

  const { error } = await supabase
    .from("job_posts")
    .insert([
      {
        user_id: user.id,
        title,
        description,
        contact_email,
        category // ✅ NUEVO
      }
    ]);

  if (error) {
    console.error(error);
    showToast("error creando oferta");
    return;
  }

  showToast("oferta publicada");
  window.location.href = "jobs.html";
}


// ===============================
// VOLVER
// ===============================
function goDashboard() {
  window.location.href = "jobs.html";
}