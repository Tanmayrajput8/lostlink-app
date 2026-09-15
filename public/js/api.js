/**
 * LostLink Frontend API Client
 * Centralized HTTP request utility with automatic Bearer token injection
 */

// Use the local backend during development and the EC2 backend in production.
const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "http://15.207.242.134:5000";
const UPLOADS_BASE_URL = `${API_BASE_URL}/uploads`;

/**
 * Perform an HTTP request to the backend REST API
 * @param {string} endpoint - API route (e.g. "/items", "/auth/login")
 * @param {object} options - fetch options (method, headers, body)
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
async function fetchAPI(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}/api${endpoint}`;
  const headers = options.headers ? { ...options.headers } : {};

  // Automatically attach JWT Bearer token if present
  const token = localStorage.getItem("token");
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If body is a plain JS object (not FormData or string), JSON encode and set header
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    // Handle token expiration: clear session if 401 received with existing token
    if (response.status === 401 && token) {
      console.warn("Session expired or unauthorized. Clearing stored token.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // If currently on an authenticated page, redirect to login
      if (window.location.pathname.includes("dashboard") || 
          window.location.pathname.includes("report") || 
          window.location.pathname.includes("claim")) {
        window.location.href = "login.html?expired=1";
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("Network or API error:", error);
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message: "Cannot connect to the server. Please try again.",
      },
    };
  }
}
