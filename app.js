import './alert.js'
import { supabase } from "./supabaseclient/supabaseclient.js";


document.addEventListener("DOMContentLoaded", () => {

  // REGISTER
  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.addEventListener("click", registerUser);
  }

  // LOGIN
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", loginUser);
  }

  // UPDATE PROFILE
  const updateBtn = document.getElementById("updateBtn");
  if (updateBtn) {
    updateBtn.addEventListener("click", updateProfile);
  }

  // LOGOUT
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // AUTO LOAD PROFILE
  if (window.location.pathname.includes("profile.html")) {
    getProfile();
  }

  // CONTROL NAV
  controlNavByRole();
  controlNavVisibility();

});


// ===============================
// REGISTRO
// ===============================
async function registerUser() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const username = document.getElementById("username").value;
  const nombre = document.getElementById("nombre").value;
  const apellidos = document.getElementById("apellidos").value;
  const rol = document.getElementById("rol").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    showToast(error.message);
    console.error(error);
    return;
  }

  const user = data.user;

  const is_company = rol === "empresa";

  const { error: profileError } = await supabase
    .from("profiles")
    .insert([
      {
        id: user.id,
        username,
        nombre,
        apellidos,
        rol,
        is_company
      }
    ]);

  if (profileError) {
    console.error(profileError);
    showToast("error guardando perfil");
    return;
  }

  showToast("registrado correctamente");
  window.location.href = "login.html";
}


// ===============================
// LOGIN
// ===============================
async function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showToast(error.message);
    console.error(error);
    return;
  }

  window.location.href = "profile.html";
}


// ===============================
// OBTENER PERFIL
// ===============================
async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("profileUsername").value = data.username;
  document.getElementById("profileNombre").value = data.nombre;
  document.getElementById("profileApellidos").value = data.apellidos;
  document.getElementById("profileRol").value = data.rol;
  document.getElementById("profileEmail").value = user.email;
  document.getElementById("profileContactoEmail").value = data.contacto_email || "";

  if (data.avatar_url) {
    document.getElementById("avatarPreview").src = data.avatar_url;
  }

  renderNavigationByRole(data.rol);
}


// ===============================
// NAV POR ROL
// ===============================
function renderNavigationByRole(rol) {
  const container = document.getElementById("dynamicNav");

  if (!container) return;

  container.innerHTML = "";

  const btn = document.createElement("button");

  if (rol === "empresa") {
    btn.textContent = "crear oferta de trabajo";
    btn.addEventListener("click", () => {
      window.location.href = "create-job.html";
    });
  } else {
    btn.textContent = "ir al dashboard";
    btn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  container.appendChild(btn);
}



async function controlNavByRole() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_company")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  const navDashboard = document.getElementById("navDashboard");

  
  if (data?.is_company && navDashboard) {
    navDashboard.style.display = "none";
  }
}


// ===============================
// CONTROL NAV GENERAL
// ===============================
async function controlNavVisibility() {
  const { data: { user } } = await supabase.auth.getUser();

  const navProfile = document.getElementById("navProfile");
  const navSaved = document.getElementById("navSaved");
  const navJobs = document.getElementById("navJobs");
  const navLogout = document.getElementById("navLogout");

  const navRegister = document.getElementById("navRegister");

  if (!user) {
    
    if (navProfile) navProfile.style.display = "none";
    if (navSaved) navSaved.style.display = "none";
    if (navJobs) navJobs.style.display = "none";
    if (navLogout) navLogout.style.display = "none";

    if (navRegister) navRegister.style.display = "block";

  } else {
    
    if (navProfile) navProfile.style.display = "block";
    if (navSaved) navSaved.style.display = "block";
    if (navJobs) navJobs.style.display = "block";
    if (navLogout) navLogout.style.display = "block";

    if (navRegister) navRegister.style.display = "none";
  }
}


// ===============================
// ACTUALIZAR PERFIL
// ===============================
async function updateProfile() {
  const { data: { user } } = await supabase.auth.getUser();

  const username = document.getElementById("profileUsername").value;
  const nombre = document.getElementById("profileNombre").value;
  const apellidos = document.getElementById("profileApellidos").value;
  const rol = document.getElementById("profileRol").value;
  const contacto_email = document.getElementById("profileContactoEmail").value;

  let avatar_url;

  const file = document.getElementById("avatarInput").files[0];

  if (file) {
    avatar_url = await uploadAvatar(file, user.id);

    if (!avatar_url) {
      showToast("error subiendo avatar");
      return;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      nombre,
      apellidos,
      rol,
      contacto_email,
      ...(avatar_url && { avatar_url })
    })
    .eq("id", user.id);

  if (error) {
    console.error(error);
    showToast("error actualizando");
    return;
  }

  showToast("cambios guardados correctamente");

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 800);
}


// ===============================
// SUBIR AVATAR
// ===============================
async function uploadAvatar(file, userId) {
  try {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;

  } catch (err) {
    console.error(err);
    return null;
  }
}


// ===============================
// LEGAL MODAL GLOBAL
// ===============================
const legalTexts = {

  legal: `
  <div class="legal-content">
     <h1>aviso legal</h1>

  <p>
    En cumplimiento con lo dispuesto en la Ley 34/2002, de Servicios de la Sociedad de la Información 
    y del Comercio Electrónico (LSSI-CE), se informa a los usuarios de los siguientes datos:
  </p>

  <h3>identificación del titular</h3>
  <p>
    Titular: sphere<br>
    Email de contacto: irebecper@alu.edu.gva.es<br>
    País de actividad: España<br>
    Actividad: desarrollo y gestión de plataforma digital de contenido creativo
  </p>

  <h3>objeto</h3>
  <p>
    El presente sitio web tiene como finalidad proporcionar una plataforma digital donde los usuarios 
    pueden publicar contenido visual relacionado con disciplinas creativas, así como consultar y 
    publicar ofertas laborales dentro del ámbito del diseño.
  </p>

  <h3>condiciones de uso</h3>
  <p>
    El acceso y uso de esta web atribuye la condición de usuario, implicando la aceptación plena 
    de las condiciones aquí recogidas. El usuario se compromete a utilizar la plataforma conforme 
    a la ley, la buena fe y el orden público.
  </p>

  <h3>responsabilidad</h3>
  <p>
    La titular no se hace responsable del uso indebido de la web por parte de los usuarios, ni de los 
    contenidos publicados por terceros. Cada usuario es responsable del contenido que comparte.
  </p>

  <h3>enlaces externos</h3>
  <p>
    Esta web puede contener enlaces a sitios externos. La titular no se responsabiliza del contenido, 
    funcionamiento o disponibilidad de dichos sitios.
  </p>

  <h3>propiedad intelectual</h3>
  <p>
    Todos los contenidos publicados por los usuarios son responsabilidad de los mismos, manteniendo 
    estos sus derechos de autor. La plataforma actúa únicamente como intermediaria de visualización.
  </p>

  <h3>modificaciones</h3>
  <p>
    La titular se reserva el derecho a modificar en cualquier momento los contenidos del sitio web, 
    así como el presente aviso legal.
  </p>
  </div>
  `,

  privacy: `
  <div class="legal-content">
    <h1>política de privacidad</h1>

  <p>
    En cumplimiento del Reglamento General de Protección de Datos (RGPD) y la normativa española 
    vigente, se informa al usuario sobre el tratamiento de sus datos personales.
  </p>

  <h3>responsable del tratamiento</h3>
  <p>
    Responsable: sphere<br>
    Email: irebecper@alu.edu.gva.es<br>
    Ubicación: España
  </p>

  <h3>datos recopilados</h3>
  <p>
    La plataforma recoge los siguientes datos personales:
    - correo electrónico
    - nombre de usuario
    - datos de perfil (nombre, apellidos, avatar)
    - contenido publicado por el usuario
  </p>

  <h3>finalidad del tratamiento</h3>
  <p>
    Los datos se utilizan para:
    - gestionar el registro y autenticación de usuarios
    - permitir la publicación de contenido
    - facilitar la interacción entre usuarios
  </p>

  <h3>base legal</h3>
  <p>
    El tratamiento de los datos se basa en el consentimiento del usuario al registrarse en la plataforma.
  </p>

  <h3>conservación de datos</h3>
  <p>
    Los datos se conservarán mientras el usuario mantenga su cuenta activa o hasta que solicite su eliminación.
  </p>

  <h3>cesión de datos</h3>
  <p>
    No se cederán datos a terceros salvo obligación legal.
  </p>

  <h3>derechos del usuario</h3>
  <p>
    El usuario puede ejercer sus derechos de acceso, rectificación, supresión y oposición 
    enviando una solicitud al correo indicado.
  </p>

  <h3>seguridad</h3>
  <p>
    La plataforma utiliza conexión segura mediante protocolo HTTPS y servicios externos 
    que garantizan la protección de la información.
  </p>

  <h3>cookies</h3>
  <p>
    Esta web utiliza cookies técnicas necesarias para su funcionamiento, especialmente en procesos 
    de autenticación y gestión de sesión mediante Supabase.
  </p>

  <p>
    Estas cookies no recopilan información personal con fines comerciales ni de análisis, 
    y son necesarias para el correcto funcionamiento del sitio.
  </p>

  <p>
    El usuario puede configurar su navegador para bloquear o eliminar cookies, aunque esto puede 
    afectar al funcionamiento de la plataforma.
  </p>
  </div>
  `,

  terms: `
  <div class="legal-content">
     <h1>términos de uso</h1>

  <p>
    El acceso y uso de esta plataforma implica la aceptación de las presentes condiciones.
  </p>

  <h3>uso de la plataforma</h3>
  <p>
    Los usuarios pueden publicar contenido visual y ofertas laborales dentro del ámbito creativo, 
    siempre respetando la legalidad vigente.
  </p>

  <h3>registro de usuarios</h3>
  <p>
    Para acceder a determinadas funcionalidades es necesario registrarse. El usuario es responsable 
    de la veracidad de los datos proporcionados.
  </p>

  <h3>responsabilidad del contenido</h3>
  <p>
    Cada usuario es responsable del contenido que publica, garantizando que dispone de los derechos 
    necesarios para su uso y difusión.
  </p>

  <h3>propiedad intelectual</h3>
  <p>
    Los usuarios conservan los derechos sobre sus obras. La plataforma no adquiere derechos sobre 
    el contenido, limitándose a su visualización.
  </p>

  <h3>interacciones externas</h3>
  <p>
    El contacto entre usuarios se realiza fuera de la plataforma, por lo que esta no se responsabiliza 
    de acuerdos, pagos o conflictos derivados.
  </p>

  <h3>limitación de responsabilidad</h3>
  <p>
    La plataforma no garantiza la disponibilidad continua del servicio ni se responsabiliza de daños 
    derivados del uso del mismo.
  </p>

  <h3>moderación</h3>
  <p>
    La titular se reserva el derecho a eliminar contenido o bloquear usuarios que incumplan estas normas.
  </p>

  <h3>modificaciones</h3>
  <p>
    Estas condiciones pueden ser modificadas en cualquier momento.
  </p>
  </div>
  `
};

document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("legalModal");
  const content = document.getElementById("legalContent");

  
  if (!modal || !content) return;

  
  document.querySelectorAll("[data-legal]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const type = link.dataset.legal;
      content.innerHTML = legalTexts[type];
      modal.classList.add("active");
    });
  });

  
  const closeBtn = document.getElementById("closeLegal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

});

// ===============================
// LOGOUT
// ===============================
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}