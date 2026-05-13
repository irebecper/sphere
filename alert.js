// alert.js

if (!window.showToast) {

const style = document.createElement("style");
style.innerHTML = `
#toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;

  display: flex;
  flex-direction: column;
  gap: 14px;
}


.toast {
  min-width: 220px;
  max-width: 320px;

  padding: 16px 18px;

  border-radius: 16px;

  background: #f1f1f1;
  color: #1f1f1f;

  font-family: "Urbanist", sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;

  
  border: none;


  box-shadow:
    5px 5px 10px rgba(0,0,0,0.18),
    -2px -2px 7px #ededed;

  opacity: 0;
  transform: translateY(-20px) scale(0.96);

  transition: all 0.35s ease;
}


.toast.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.toast:hover {
  transform: translateY(-2px);

  box-shadow:
    7px 7px 14px rgba(0,0,0,0.2),
    -6px -6px 12px rgba(255,255,255,0.8);
}
`;

document.head.appendChild(style);

const container = document.createElement("div");
container.id = "toast-container";
document.body.appendChild(container);

window.showToast = function (message, type = "info", duration = 3000) {

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      if (toast.parentNode) {
        container.removeChild(toast);
      }
    }, 300);

  }, duration);

};

}