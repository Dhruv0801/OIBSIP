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

const USERS_KEY = "flowauth_users";
const SESSION_KEY = "flowauth_session";

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

function readUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function validatePassword(password) {
  const longEnough = password.length >= 8;
  const hasNumber = /\d/.test(password);
  return longEnough && hasNumber;
}

function findUser(users, identity) {
  const lowered = identity.toLowerCase();
  return users.find(user => user.identity.toLowerCase() === lowered);
}

async function handleRegister(event) {
  event.preventDefault();

  const identity = registerIdentity.value.trim();
  const password = registerPassword.value.trim();

  registerMessage.textContent = "";

  if (!identity || !password) {
    registerMessage.textContent = "Please fill in all fields.";
    return;
  }

  if (!validatePassword(password)) {
    registerMessage.textContent =
      "Password must be at least 8 characters and contain a number.";
    return;
  }

  const users = readUsers();
  const existing = findUser(users, identity);

  if (existing) {
    registerMessage.textContent =
      "An account with these details already exists.";
    return;
  }

  const hash = await sha256(password);

  const newUser = {
    identity,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };

  writeUsers([...users, newUser]);

  registerMessage.textContent = "Account created. You can now log in.";
  registerForm.reset();
}

async function handleLogin(event) {
  event.preventDefault();

  const identity = loginIdentity.value.trim();
  const password = loginPassword.value.trim();

  loginMessage.textContent = "";

  if (!identity || !password) {
    loginMessage.textContent = "Please fill in all fields.";
    return;
  }

  const users = readUsers();
  const user = findUser(users, identity);
  const hash = await sha256(password);
  const valid = user && user.passwordHash === hash;

  if (!valid) {
    loginMessage.textContent =
      "The details you entered do not match our records.";
    return;
  }

  writeSession({
    identity: user.identity,
    loggedInAt: new Date().toISOString()
  });

  await loadDashboardFromSession();
  setActiveView("dashboard");
}

async function loadDashboardFromSession() {
  const session = readSession();

  if (!session) {
    dashWelcome.textContent = "";
    dashMessage.textContent = "Not authenticated.";
    setActiveView("login");
    loginMessage.textContent =
      "You need to be logged in to access the dashboard.";
    return;
  }

  dashWelcome.textContent = `Welcome, ${session.identity}`;
  dashMessage.textContent = "";
}

function handleLogout() {
  clearSession();
  dashMessage.textContent = "You have been logged out.";
  setActiveView("login");
  loginMessage.textContent = "";
}

tabButtons.forEach(button => {
  button.addEventListener("click", async () => {
    const view = button.dataset.view;

    if (view === "dashboard") {
      await loadDashboardFromSession();
      return;
    }

    setActiveView(view);
  });
});

loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
logoutBtn.addEventListener("click", handleLogout);

setActiveView("login");