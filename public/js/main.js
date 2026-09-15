/**
 * LostLink Main UI Utilities
 * Toasts, image upload previews, formatting, and common helpers
 */

// ── Toast Notification System ──────────────────────────────────────────────
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 16px;">${icons[type] || "ℹ"}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ── Text Safety & Utilities ───────────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS when inserting into innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Truncate a string to maxLen characters, appending '...' if truncated.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function truncateText(str, maxLen = 60) {
  if (!str) return "";
  const s = String(str);
  return s.length > maxLen ? s.slice(0, maxLen) + "..." : s;
}

/**
 * Build the full URL to an uploaded image file served by Express.
 * @param {string} filename - just the stored filename (e.g. "abc123.jpg")
 * @returns {string} - full backend URL for the uploaded image
 */
function getUploadUrl(filename) {
  if (!filename) return "";
  const imagePath = String(filename).replace(/\\/g, "/");
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  if (imagePath.startsWith("/uploads/")) return `${UPLOADS_BASE_URL}${imagePath.slice("/uploads".length)}`;
  if (imagePath.startsWith("uploads/")) return `${UPLOADS_BASE_URL}/${imagePath.slice("uploads/".length)}`;
  return `${UPLOADS_BASE_URL}/${imagePath}`;
}

// ── Formatters ─────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderStatusBadge(status) {
  const map = {
    active: "badge-active",
    claimed: "badge-claimed",
    resolved: "badge-resolved",
    expired: "badge-expired",
    deleted: "badge-rejected",
    pending: "badge-pending",
    approved: "badge-approved",
    rejected: "badge-rejected",
    withdrawn: "badge-withdrawn",
  };
  const cls = map[status] || "badge-active";
  return `<span class="badge ${cls}">${status.toUpperCase()}</span>`;
}

// ── Image Preview Setup ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const fileInputs = document.querySelectorAll('input[type="file"][data-preview]');
  fileInputs.forEach((input) => {
    const previewContainerId = input.getAttribute("data-preview");
    const previewContainer = document.getElementById(previewContainerId);
    if (!previewContainer) return;

    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) {
        previewContainer.innerHTML = "";
        return;
      }

      // Format check
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        showToast("Invalid file type. Only JPG, PNG, and WEBP allowed.", "error");
        input.value = "";
        previewContainer.innerHTML = "";
        return;
      }

      // Size check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("File is too large. Maximum size is 5MB.", "error");
        input.value = "";
        previewContainer.innerHTML = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        previewContainer.innerHTML = `
          <div class="image-preview">
            <img src="${e.target.result}" alt="Preview" />
            <button type="button" class="remove-image" title="Remove image">✕</button>
          </div>
        `;

        previewContainer.querySelector(".remove-image").addEventListener("click", () => {
          input.value = "";
          previewContainer.innerHTML = "";
        });
      };
      reader.readAsDataURL(file);
    });
  });
});
