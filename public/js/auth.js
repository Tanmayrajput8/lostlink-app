/**
 * LostLink Authentication & Session Utilities
 */

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
}

function isAuthenticated() {
  return !!getToken();
}

function isAdmin() {
  const u = getUser();
  return u && u.role === "admin";
}

function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

/**
 * Route protection: Call on protected pages (dashboard, report-lost, report-found, claim)
 */
function requireAuth() {
  if (!isAuthenticated()) {
    const current = encodeURIComponent(window.location.pathname.split("/").pop() || "dashboard.html");
    window.location.href = `login.html?redirect=${current}`;
  }
}

/**
 * Admin route protection: Call on admin pages
 */
function requireAdmin() {
  requireAuth();
  if (!isAdmin()) {
    window.location.href = "dashboard.html";
  }
}

/**
 * Dynamically updates the navbar depending on whether user is logged in
 */
function renderNavbar() {
  const user = getUser();
  const navLinks = document.getElementById("nav-links");
  const navRight = document.getElementById("nav-right");

  if (!navLinks || !navRight) return;

  if (user) {
    navLinks.innerHTML = `
      <a href="items.html" class="nav-link">Browse Items</a>
      <a href="report-lost.html" class="nav-link">Report Lost</a>
      <a href="report-found.html" class="nav-link">Report Found</a>
      <a href="dashboard.html" class="nav-link" style="font-weight: 600; color: var(--primary);">
        ${user.role === "admin" ? "Admin Panel" : "My Dashboard"}
      </a>
    `;

    navRight.innerHTML = `
      <span style="font-size: 14px; font-weight: 600; color: var(--slate-700);">
        ${user.name ? user.name.split(" ")[0] : "User"}
      </span>
      <button onclick="logout()" class="btn btn-sm btn-secondary" style="margin-left: 8px;">Logout</button>
    `;
  } else {
    navLinks.innerHTML = `
      <a href="items.html" class="nav-link">Browse Items</a>
      <a href="report-lost.html" class="nav-link">Report Lost</a>
      <a href="report-found.html" class="nav-link">Report Found</a>
    `;

    navRight.innerHTML = `
      <a href="login.html" class="btn btn-sm btn-ghost">Login</a>
      <a href="register.html" class="btn btn-sm btn-primary">Register</a>
    `;
  }
}

document.addEventListener("DOMContentLoaded", renderNavbar);
