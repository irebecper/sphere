import { supabase } from "./supabaseclient/supabaseclient.js";

// ===============================
// ESTILOS POR CATEGORÍA
// ===============================
const stylesByCategory = {
  "diseño gráfico": [
    "branding / identidad corporativa",
    "diseño editorial",
    "diseño publicitario",
    "packaging",
    "diseño UX/UI",
    "motion graphics",
    "tipografía"
  ],
  "modelado 3d": [
    "modelado hard surface",
    "modelado orgánico",
    "escultura digital",
    "texturizado",
    "renderizado"
  ],
  "arquitectura": [
    "arquitectura residencial",
    "arquitectura comercial",
    "urbanismo"
  ],
  "ilustración": [
    "ilustración editorial",
    "concept art",
    "storyboard"
  ],
  "animación": [
    "animación 2D",
    "animación 3D",
    "motion graphics"
  ],
  "interiorismo": [
    "interiorismo residencial",
    "retail design"
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadSaved();

  const btn = document.getElementById("goBackBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  // ===============================
  // FILTROS
  // ===============================

  const categorySelect = document.getElementById("filterCategory");
  const styleSelect = document.getElementById("filterStyle");

  if (categorySelect && styleSelect) {
    categorySelect.addEventListener("change", () => {
      const selected = categorySelect.value;

      styleSelect.innerHTML = '<option value="">disciplinas</option>';

      if (stylesByCategory[selected]) {
        stylesByCategory[selected].forEach(style => {
          const option = document.createElement("option");
          option.value = style;
          option.textContent = style;
          styleSelect.appendChild(option);
        });
      }

      loadSaved();
    });
  }

  if (categorySelect) categorySelect.addEventListener("change", loadSaved);
  if (styleSelect) styleSelect.addEventListener("change", loadSaved);

  document.querySelectorAll('#filterTags input').forEach(cb => {
    cb.addEventListener("change", loadSaved);
  });

  
  const trigger = document.querySelector(".select-trigger");
  const dropdown = document.querySelector(".select-options");

  if (trigger && dropdown) {
    trigger.addEventListener("click", () => {
      dropdown.style.display =
        dropdown.style.display === "flex" ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-select")) {
        dropdown.style.display = "none";
      }
    });
  }

  
  const toggle = document.getElementById("filtersToggle");
  const content = document.getElementById("filtersContent");

  if (toggle && content) {
    toggle.addEventListener("click", () => {
      content.classList.toggle("active");
    });
  }
});


async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
  }
}


function createPostCard(post, onRemoveClick) {
  const div = document.createElement("div");
  div.classList.add("feed-post");

  const profile = post.profile || {};

  div.innerHTML = `
    <img src="${post.image_url}" class="feed-img">

    <div class="post-overlay">
      <div class="post-user">

        <img src="${profile.avatar_url || 'https://via.placeholder.com/50'}" class="avatar-small">

        <div class="post-user-info">
          <strong>${profile.nombre || ''} ${profile.apellidos || ''}</strong>
          <span>@${profile.username || ''}</span>
          ${
            profile?.contacto_email
              ? `<a href="mailto:${profile.contacto_email}">${profile.contacto_email}</a>`
              : `Sin contacto`
          }
        </div>

        <button class="like-btn liked">
          <svg viewBox="-2 -2 36 34" class="heart">
            <path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,13.5,16,21.2
            c6.6-7.7,16-12.2,16-21.2C32,3.8,28.2,0,23.6,0z"/>
          </svg>
        </button>

      </div>
    </div>
  `;

  const likeBtn = div.querySelector(".like-btn");

  likeBtn.addEventListener("click", async () => {
    likeBtn.classList.remove("animate");
    void likeBtn.offsetWidth;

    likeBtn.classList.remove("liked");
    likeBtn.classList.add("unliked");

    likeBtn.classList.add("animate");

    setTimeout(async () => {
      await onRemoveClick(post);
    }, 600);
  });

  return div;
}

// ===============================
// CARGAR GUARDADOS + FILTROS
// ===============================
async function loadSaved() {
  const { data: { user } } = await supabase.auth.getUser();

  const container = document.getElementById("feedContainer");

  const { data, error } = await supabase
    .from("favorites")
    .select("id, posts(*)")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    container.innerHTML = "<p>error</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>no tienes favoritos</p>";
    return;
  }

  const posts = data.map(item => ({
    ...item.posts,
    favId: item.id
  }));

  // ===============================
  // FILTROS
  // ===============================
  const category = document.getElementById("filterCategory")?.value || "";
  const style = document.getElementById("filterStyle")?.value || "";

  const selectedTags = Array.from(
    document.querySelectorAll('#filterTags input:checked')
  ).map(cb => cb.value);

  let filtered = posts;

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  if (style) {
    filtered = filtered.filter(p => p.style === style);
  }

  if (selectedTags.length > 0) {
    filtered = filtered.filter(p =>
      p.tags?.some(tag => selectedTags.includes(tag))
    );
  }

  // ===============================
  // perfiles
  // ===============================
  const userIds = [...new Set(filtered.map(p => p.user_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  const profileMap = {};
  profiles?.forEach(p => {
    profileMap[p.id] = p;
  });

  const finalPosts = filtered.map(post => ({
    ...post,
    profile: profileMap[post.user_id]
  }));

  renderSaved(finalPosts);
}


async function removeFavorite(post) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("id", post.favId);

  if (error) {
    console.error(error);
    return;
  }

  loadSaved();
}


function renderSaved(posts) {
  const container = document.getElementById("feedContainer");
  container.innerHTML = "";

  posts.forEach(post => {
    const card = createPostCard(post, removeFavorite);
    container.appendChild(card);
  });
}