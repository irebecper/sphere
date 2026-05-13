import './alert.js'
import { supabase } from "./supabaseclient/supabaseclient.js";

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();

  const jobsBtn = document.getElementById("goJobsBtn");
  if (jobsBtn) {
    jobsBtn.addEventListener("click", () => {
      window.location.href = "jobs.html";
    });
  }

  
  const editBtn = document.getElementById("editProfileBtn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }
});

// ===============================
// SUBIR POST
// ===============================
function goUpload() {
  window.location.href = "upload-post.html";
}

// ===============================
// CARGAR DASHBOARD
// ===============================
async function loadDashboard() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await loadUserInfo(user.id, user.email);
  await loadUserPosts(user.id);
}

// ===============================
// INFO USUARIO
// ===============================
async function loadUserInfo(userId, email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("dashUsername").textContent = data.username;
  document.getElementById("dashNombre").textContent = data.nombre + " " + data.apellidos;
  document.getElementById("dashRol").textContent = data.rol;

  const contactoEl = document.getElementById("dashContacto");

  if (data.contacto_email) {
    contactoEl.href = `mailto:${data.contacto_email}`;
    contactoEl.textContent = data.contacto_email;
  } else {
    contactoEl.textContent = "sin email de contacto";
  }

  if (data.avatar_url) {
    document.getElementById("dashAvatar").src = data.avatar_url;
  }
}


function createPostCard(post, profile) {
  const div = document.createElement("div");
  div.classList.add("feed-post");

  div.innerHTML = `
    <img src="${post.image_url}" class="feed-img">

    <div class="post-overlay">
      <div class="post-user">
        <img src="${profile?.avatar_url || 'https://via.placeholder.com/50'}" class="avatar-small">

        <div class="post-user-info">
          <strong>${profile?.nombre || ''} ${profile?.apellidos || ''}</strong>
          <span>@${profile?.username || ''}</span>
          ${
            profile?.contacto_email
              ? `<a href="mailto:${profile.contacto_email}">${profile.contacto_email}</a>`
              : `Sin contacto`
          }
        </div>

        <button class="delete-btn">
          <svg viewBox="20 10 60 80" class="trash-icon">
            <rect x="25" y="15" width="50" height="10" rx="2" />
            <rect x="30" y="25" width="40" height="60" rx="3" />
            <line x1="40" y1="35" x2="40" y2="75" />
            <line x1="50" y1="35" x2="50" y2="75" />
            <line x1="60" y1="35" x2="60" y2="75" />
          </svg>
        </button>

      </div>
    </div>
  `;

  const deleteBtn = div.querySelector(".delete-btn");

  deleteBtn.addEventListener("click", async () => {
  const confirmed = await confirmDeleteModal();
  if (!confirmed) return;

  
  const postRect = div.getBoundingClientRect();
  const btnRect = deleteBtn.getBoundingClientRect();

  
  const btnCenterX = btnRect.left + btnRect.width / 2;
  const btnCenterY = btnRect.top + btnRect.height / 2;

  
  const postCenterX = postRect.left + postRect.width / 2;
  const postCenterY = postRect.top + postRect.height / 2;

 
  const deltaX = btnCenterX - postCenterX;
  const deltaY = btnCenterY - postCenterY;

  
  div.classList.add("deleting");

  div.style.transform = `
    translate(${deltaX}px, ${deltaY}px)
    scale(0.1)
  `;
  div.style.opacity = "0";
  div.style.filter = "blur(6px)";

 
  setTimeout(async () => {
    await deletePost(post, div);
  }, 500);
});

  return div;
}

// ===============================
// ELIMINAR POST
// ===============================
async function deletePost(post, element) {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", post.id);

  if (error) {
    console.error(error);
    return;
  }

 
  element.remove();
}

// ===============================
// POSTS USUARIO
// ===============================
async function loadUserPosts(userId) {
  const container = document.getElementById("feedContainer");

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("No hay posts aún o tabla no creada");
    container.innerHTML = "<p>no hay publicaciones todavía</p>";
    return;
  }

  if (!posts || posts.length === 0) {
    container.innerHTML = "<p>no hay publicaciones todavía</p>";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  container.innerHTML = "";

  posts.forEach(post => {
    const card = createPostCard(post, profile);
    container.appendChild(card);
  });
}

// ===============================
// MODAL CONFIRMACIÓN
// ===============================
function confirmDeleteModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const confirmBtn = document.getElementById("confirmDelete");
    const cancelBtn = document.getElementById("cancelDelete");

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
// VOLVER
// ===============================
function goBack() {
  window.location.href = "profile.html";
}