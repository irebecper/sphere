import { supabase } from "./supabaseclient/supabaseclient.js";

let jobId = null;

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  const params = new URLSearchParams(window.location.search);
  jobId = params.get("id");

  loadJob();

  document.getElementById("saveBtn").addEventListener("click", saveJob);

  
  document.getElementById("deleteBtn").addEventListener("click", async () => {
    const confirmed = await confirmDeleteModal({
      title: "¿eliminar oferta?",
      message: "esta oferta desaparecerá permanentemente."
    });

    if (!confirmed) return;

    const card = document.querySelector(".ui-card");

    
    card.style.transition = "all 0.4s ease";
    card.style.transform = "scale(0.1)";
    card.style.opacity = "0";
    card.style.filter = "blur(6px)";

    setTimeout(async () => {
      await deleteJob();
    }, 400);
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "jobs.html";
  });
});


// ===============================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
  }
}


// ===============================
async function loadJob() {
  const { data, error } = await supabase
    .from("job_posts")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("editTitle").value = data.title;
  document.getElementById("editDescription").value = data.description;
  document.getElementById("editEmail").value = data.contact_email;
}


// ===============================
async function saveJob() {
  const title = document.getElementById("editTitle").value.trim();
  const description = document.getElementById("editDescription").value.trim();
  const contact_email = document.getElementById("editEmail").value.trim();

  if (!title || !description || !contact_email) return;

  const { error } = await supabase
    .from("job_posts")
    .update({ title, description, contact_email })
    .eq("id", jobId);

  if (error) {
    console.error(error);
    return;
  }

  window.location.href = "jobs.html";
}


// ===============================
// MODAL 
// ===============================
function confirmDeleteModal({
  title = "¿eliminar?",
  message = "esta acción no se puede deshacer."
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const confirmBtn = document.getElementById("confirmDelete");
    const cancelBtn = document.getElementById("cancelDelete");

    
    modal.querySelector("h3").textContent = title;
    modal.querySelector("p").textContent = message;

    modal.classList.add("active");

    const clean = () => {
      modal.classList.remove("active");
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
    };

    const onConfirm = () => {
      clean();
      resolve(true);
    };

    const onCancel = () => {
      clean();
      resolve(false);
    };

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });
}


// ===============================
// DELETE
// ===============================
async function deleteJob() {
  const { error } = await supabase
    .from("job_posts")
    .delete()
    .eq("id", jobId);

  if (error) {
    console.error(error);
    return;
  }

  window.location.href = "jobs.html";
}