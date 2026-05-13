import './alert.js'
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
    "tipografía",
    "señalética / wayfinding",
    "diseño web",
    "diseño para redes sociales",
    "infografía",
    "diseño de información",
    "diseño interactivo"
  ],
  "modelado 3d": [
    "modelado hard surface",
    "modelado orgánico",
    "escultura digital",
    "texturizado",
    "shading / materiales",
    "iluminación (lighting)",
    "renderizado",
    "rigging",
    "simulación (fluidos, telas, partículas)",
    "visualización arquitectónica (ArchViz)",
    "modelado para videojuegos",
    "modelado para cine/VFX",
    "impresión 3D"
  ],
  "arquitectura": [
    "arquitectura residencial",
    "arquitectura comercial",
    "urbanismo",
    "paisajismo",
    "arquitectura sostenible",
    "restauración",
    "arquitectura efímera",
    "arquitectura paramétrica",
    "arquitectura interior",
    "arquitectura bioclimática"
  ],
  "ilustración": [
    "ilustración editorial",
    "ilustración publicitaria",
    "concept art",
    "ilustración científica",
    "ilustración infantil",
    "ilustración de moda",
    "ilustración técnica",
    "storyboard",
    "ilustración médica"
  ],
  "animación": [
    "animación 2D tradicional",
    "animación 2D digital",
    "animación 3D",
    "stop motion",
    "motion graphics",
    "animación experimental",
    "animación para videojuegos",
    "animación publicitaria",
    "vfx"
  ],
  "interiorismo": [
    "interiorismo residencial",
    "interiorismo comercial",
    "diseño de espacios efímeros",
    "home staging",
    "diseño de iluminación",
    "diseño de mobiliario",
    "retail design",
    "escenografía"
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  loadFeed();
  checkUser();
  hideUploadIfCompany(); 

  const btn = document.getElementById("goUploadBtn");
  if (btn) btn.addEventListener("click", goUpload);

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

      loadFeed();
    });
  }

  document.getElementById("filterCategory").addEventListener("change", loadFeed);

  if (styleSelect) styleSelect.addEventListener("change", loadFeed);

  document.querySelectorAll('#filterTags input').forEach(cb => {
    cb.addEventListener("change", loadFeed);
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

// ===============================
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const btn = document.getElementById("goUploadBtn");
    if (btn) btn.style.display = "none";
  }
}

// ===============================
// OCULTAR BOTÓN SI ES EMPRESA
// ===============================
async function hideUploadIfCompany() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("profiles")
    .select("is_company")
    .eq("id", user.id)
    .single();

  if (data?.is_company) {
    const btn = document.getElementById("goUploadBtn");
    if (btn) btn.style.display = "none";
  }
}


function goUpload() {
  window.location.href = "upload-post.html";
}

// ===============================
// CARD
// ===============================
function createPostCard(post, onFavClick) {
  const div = document.createElement("div");
  div.classList.add("feed-post");

  const profile = post.profile || {};

  div.innerHTML = `
    <img src="${post.image_url}" class="feed-img">

    <div class="post-overlay">
      <div class="post-user">

        <img src="${profile.avatar_url || 'https://via.placeholder.com/50'}">

        <div class="post-user-info">
          <strong>${profile.nombre || ''} ${profile.apellidos || ''}</strong>
          <span>@${profile.username || ''}</span>
          <span>${
            profile?.contacto_email
              ? `<a href="mailto:${profile.contacto_email}">${profile.contacto_email}</a>`
              : `Sin contacto`
          }</span>
        </div>

        <button class="like-btn">
          <svg viewBox="-2 -2 36 34" class="heart">
            <path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,13.5,16,21.2
            c6.6-7.7,16-12.2,16-21.2C32,3.8,28.2,0,23.6,0z"/>
          </svg>
        </button>

      </div>
    </div>
  `;

  const likeBtn = div.querySelector(".like-btn");

  if (post.isLiked) {
    likeBtn.classList.add("liked");
  }

  likeBtn.addEventListener("click", async () => {
    const isNowLiked = await onFavClick(post);

    likeBtn.classList.remove("animate");
    void likeBtn.offsetWidth;

    if (isNowLiked) {
      likeBtn.classList.remove("unliked");
      likeBtn.classList.add("liked");
    } else {
      likeBtn.classList.remove("liked");
      likeBtn.classList.add("unliked");
    }

    likeBtn.classList.add("animate");

    setTimeout(() => {
      likeBtn.classList.remove("animate");
      likeBtn.classList.remove("unliked");
    }, 600);
  });

  return div;
}

// ===============================
// FEED
// ===============================
async function loadFeed() {
  const container = document.getElementById("feedContainer");

  const { data: { user } } = await supabase.auth.getUser();

  const category = document.getElementById("filterCategory").value;
  const style = document.getElementById("filterStyle")?.value || "";

  const selectedTags = Array.from(
    document.querySelectorAll('#filterTags input:checked')
  ).map(cb => cb.value);

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (style) query = query.eq("style", style);
  if (selectedTags.length > 0) query = query.overlaps("tags", selectedTags);

  const { data: posts, error } = await query;

  if (error) {
    console.error(error);
    container.innerHTML = "<p>error cargando feed</p>";
    return;
  }

  if (!posts || posts.length === 0) {
    container.innerHTML = "<p>no hay resultados</p>";
    return;
  }

  const userIds = [...new Set(posts.map(p => p.user_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  const profileMap = {};
  profiles?.forEach(p => profileMap[p.id] = p);

  let favIds = [];

  if (user) {
    const { data: favorites } = await supabase
      .from("favorites")
      .select("post_id")
      .eq("user_id", user.id);

    favIds = favorites?.map(f => f.post_id) || [];
  }

  const postsWithProfiles = posts.map(post => ({
    ...post,
    profile: profileMap[post.user_id],
    isLiked: favIds.includes(post.id)
  }));

  renderPosts(postsWithProfiles);
}

// ===============================
// FAVORITOS
// ===============================
async function toggleFavorite(post) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return false;
  }

  const { data: existing } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .eq("post_id", post.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    return false;
  } else {
    await supabase
      .from("favorites")
      .insert([{ user_id: user.id, post_id: post.id }]);

    return true;
  }
}


function renderPosts(posts) {
  const container = document.getElementById("feedContainer");
  container.innerHTML = "";

  posts.forEach(post => {
    const card = createPostCard(post, toggleFavorite);
    container.appendChild(card);
  });
}