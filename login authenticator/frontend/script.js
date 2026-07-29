const tabButtons = document.querySelectorAll(".tab-btn");
const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const dashboardView = document.getElementById("dashboardView");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const dashWelcome = document.getElementById("dashWelcome");
const dashMessage = document.getElementById("dashMessage");
const logoutBtn = document.getElementById("logoutBtn");

const loginIdentity = document.getElementById("loginIdentity");
const loginPassword = document.getElementById("loginPassword");
const registerIdentity = document.getElementById("registerIdentity");
const registerPassword = document.getElementById("registerPassword");

// Change this to your Render backend URL after deployment
const API_BASE = "https://YOUR_BACKEND_HOSTNAME.onrender.com";

function setActiveView(name) {
  loginView.classList.add("hidden");
  registerView.classList.add("hidden");
  dashboardView.classList.add("hidden");
  tabButtons.forEach(btn => btn.classList.remove("active"));

  if (name === "login") {
    loginView.classList.remove("hidden");
    document.querySelector('[data-view="login"]').classList.add("active");
  }

  if (name === "register") {
    registerView.classList.remove("hidden");
    document.querySelector('[data-view="register"]').classList.add("active");
  }

  if (name === "dashboard") {
    dashboardView.classList.remove("hidden");
    document.querySelector('[data-view="dashboard"]').classList.add("active");
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const identity = registerIdentity.value.trim();
  const password = registerPassword.value.trim();

  registerMessage.textContent = "";

  const response = await fetch(API_BASE + "/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity, password })
  });

  const data = await response.json();
  registerMessage.textContent = data.message;
}

async function handleLogin(event) {
  event.preventDefault();

  const identity = loginIdentity.value.trim();
  const password = loginPassword.value.trim();

  loginMessage.textContent = "";

  const response = await fetch(API_BASE + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ identity, password })
  });

  const data = await response.json();
  loginMessage.textContent = data.message;

  if (data.ok) {
    await loadDashboard();
    setActiveView("dashboard");
  }
}

async function loadDashboard() {
  const response = await fetch(API_BASE + "/api/me", {
    credentials: "include"
  });

  if (!response.ok) {
    dashWelcome.textContent = "";
    dashMessage.textContent = "Not authenticated.";
    setActiveView("login");
    loginMessage.textContent =
      "You need to be logged in to access the dashboard.";
    return;
  }

  const data = await response.json();
  dashWelcome.textContent = `Welcome, ${data.user.identity}`;
  dashMessage.textContent = "";
}

async function handleLogout() {
  const response = await fetch(API_BASE + "/api/logout", {
    method: "POST",
    credentials: "include"
  });

  const data = await response.json();
  dashMessage.textContent = data.message;
  setActiveView("login");
  loginMessage.textContent = "You have been logged out.";
}

tabButtons.forEach(button => {
  button.addEventListener("click", async () => {
    const view = button.dataset.view;

    if (view === "dashboard") {
      await loadDashboard();
      return;
    }

    setActiveView(view);
  });
});

loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
logoutBtn.addEventListener("click", handleLogout);

setActiveView("login");