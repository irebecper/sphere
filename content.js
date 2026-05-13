import { supabase } from "./supabaseclient/supabaseclient.js";

document.addEventListener("DOMContentLoaded", () => {
  loadContent();
});

async function loadContent() {
  const container = document.getElementById("contentContainer");

  
  const type = document.body.dataset.type;

  let query = supabase
    .from("content_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    container.innerHTML = "<p>error cargando contenido</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>no hay contenido todavía</p>";
    return;
  }

  container.innerHTML = "";

  data.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("ui-card", "content-card");

    div.innerHTML = `
  <img src="${item.image_url}" class="content-img">

  <div class="content-info">
    <h3>${item.title}</h3>
    <p>${item.description}</p>
    <a href="${item.link}" target="_blank">ver artículo</a>
  </div>
`;

    container.appendChild(div);
  });
}