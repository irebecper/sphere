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
  const btn = document.getElementById("uploadPostBtn");
  if (btn) {
    btn.addEventListener("click", uploadPost);
  }

  const categorySelect = document.getElementById("postCategory");
  const styleSelect = document.getElementById("postStyle");

  if (categorySelect && styleSelect) {
    categorySelect.addEventListener("change", () => {
      const selected = categorySelect.value;

      styleSelect.innerHTML = '<option value="">selecciona estilo</option>';

      if (stylesByCategory[selected]) {
        stylesByCategory[selected].forEach(style => {
          const option = document.createElement("option");
          option.value = style;
          option.textContent = style;
          styleSelect.appendChild(option);
        });
      }
    });
  }
});


// ===============================
// SUBIR POST
// ===============================
async function uploadPost() {
  const btn = document.getElementById("uploadPostBtn");

  btn.disabled = true;
  btn.textContent = "publicando...";

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const file = document.getElementById("postImage").files[0];
  const imageUrlInput = document.getElementById("postImageUrl")?.value.trim();

  const category = document.getElementById("postCategory").value;
  const style = document.getElementById("postStyle")?.value || "";

  const checkboxes = document.querySelectorAll('#tagsContainer input[type="checkbox"]:checked');
  const tags = Array.from(checkboxes).map(cb => cb.value);

  if (!file && !imageUrlInput) {
    showToast("añade imagen o vídeo");
    resetButton(btn);
    return;
  }

  if (!category) {
    showToast("selecciona una categoría");
    resetButton(btn);
    return;
  }

  let finalUrl = "";
  let isVideo = false;

 
  if (file) {
    isVideo = file.type.startsWith("video");

    finalUrl = await uploadImage(file, user.id);

    if (!finalUrl) {
      showToast("error subiendo archivo");
      resetButton(btn);
      return;
    }
  }

  
  else if (imageUrlInput) {
    finalUrl = imageUrlInput;

    
    if (imageUrlInput.match(/\.(mp4|webm|ogg)$/i)) {
      isVideo = true;
    }
  }

  const { error } = await supabase
    .from("posts")
    .insert([
      {
        user_id: user.id,
        image_url: finalUrl,
        category,
        tags,
        style,
        is_video: isVideo 
      }
    ]);

  if (error) {
    console.error(error);
    showToast("error guardando publicación");
    resetButton(btn);
    return;
  }

  showToast("publicado!");

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 800);
}

function resetButton(btn) {
  btn.disabled = false;
  btn.textContent = "publicar";
}


// ===============================
// SUBIR ARCHIVO 
// ===============================
async function uploadImage(file, userId) {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from("posts")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      return null;
    }

    const { data } = supabase.storage
      .from("posts")
      .getPublicUrl(filePath);

    return data.publicUrl;

  } catch (err) {
    console.error(err);
    return null;
  }
}

// ===============================
// DROPDOWN TAGS 
// ===============================
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


// ===============================
// VOLVER
// ===============================
function goDashboard() {
  window.location.href = "dashboard.html";
}