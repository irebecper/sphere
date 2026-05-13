import { supabase } from "./supabaseclient/supabaseclient.js";

let currentUser = null;
let isCompany = false;

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await checkIfCompany(); 

  loadJobs();

  const btn = document.getElementById("goBackBtn");
  if (btn) {
    btn.addEventListener("click", goBack);
  }

  const filter = document.getElementById("filterCategory");
  if (filter) {
    filter.addEventListener("change", loadJobs);
  }

  const typeFilter = document.getElementById("jobFilterType");
  if (typeFilter) {
    typeFilter.addEventListener("change", loadJobs);
  }

  
  const createBtn = document.getElementById("goCreateJobBtn");

  if (createBtn) {
    if (isCompany) {
      createBtn.style.display = "block";

      createBtn.addEventListener("click", () => {
        window.location.href = "create-job.html";
      });

    } else {
      createBtn.style.display = "none";
    }
  }
});


// ===============================
// CONTROL LOGIN
// ===============================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
  }

  currentUser = user;
}


// ===============================
// SI ES EMPRESA
// ===============================
async function checkIfCompany() {
  const { data } = await supabase
    .from("profiles")
    .select("is_company")
    .eq("id", currentUser.id)
    .single();

  isCompany = data?.is_company || false;

  if (!isCompany) {
    const typeFilter = document.getElementById("jobFilterType");
    if (typeFilter) {
      typeFilter.style.display = "none";
    }
  }
}


// ===============================
// CARGAR OFERTAS
// ===============================
async function loadJobs() {
  const container = document.getElementById("jobsContainer");

  const categoryElement = document.getElementById("filterCategory");
  const category = categoryElement ? categoryElement.value : "";

  const typeFilter = document.getElementById("jobFilterType");
  const type = typeFilter ? typeFilter.value : "all";

  let query = supabase
    .from("job_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  // MIS OFERTAS
  if (type === "mine" && currentUser) {
    query = query.eq("user_id", currentUser.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    container.innerHTML = "<p>error cargando ofertas</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>no hay ofertas disponibles</p>";
    return;
  }

  
  const userIds = [...new Set(data.map(j => j.user_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  const profileMap = {};
  profiles?.forEach(p => {
    profileMap[p.id] = p;
  });

  const jobsWithProfiles = data.map(job => ({
    ...job,
    profile: profileMap[job.user_id]
  }));

  renderJobs(jobsWithProfiles);
}


// ===============================
// RENDER OFERTAS
// ===============================
function renderJobs(jobs) {
  const container = document.getElementById("jobsContainer");
  container.innerHTML = "";

  jobs.forEach(job => {
    const div = document.createElement("div");

    
    div.classList.add("ui-card", "job-card");

    const profile = job.profile || {};

    div.innerHTML = `
      <div class="job-header">
        <div class="job-title">${job.title}</div>
        <div class="job-type">${job.category || ""}</div>
      </div>

      <div class="job-company">
        ${profile.nombre || ''} ${profile.apellidos || ''}
      </div>

      <div class="job-description">
        ${job.description}
      </div>

      <div class="job-footer">
        <a href="mailto:${job.contact_email}">
          ${job.contact_email}
        </a>
      </div>
    `;

    container.appendChild(div);

    addEditButton(job, div);
  });
}


// ===============================
async function addEditButton(job, div) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  if (user.id === job.user_id) {
    const editBtn = document.createElement("button");
    editBtn.textContent = "editar";

    editBtn.addEventListener("click", () => {
      window.location.href = `edit-job.html?id=${job.id}`;
    });

    div.appendChild(editBtn);
  }
}


// ===============================
function goBack() {
  window.location.href = "profile.html";
}