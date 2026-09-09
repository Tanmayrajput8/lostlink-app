/**
 * LostLink Client-Side Form Validation
 * Provides real-time feedback and enforces clean inputs before API requests
 */

const validationRules = {
  name: {
    validate: (val) => /^[a-zA-Z\s]{2,50}$/.test(val.trim()),
    message: "Name can only contain letters and spaces (2-50 characters)",
  },
  email: {
    validate: (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim()),
    message: "Please enter a valid email address",
  },
  password: {
    validate: (val) => val.length >= 6,
    message: "Password must be at least 6 characters",
  },
  phone: {
    validate: (val) => !val || /^\d{10}$/.test(val.trim()),
    message: "Phone number must be exactly 10 digits",
  },
  title: {
    validate: (val) => {
      const trimmed = val.trim();
      return trimmed.length >= 3 && trimmed.length <= 100 && !/^\d+$/.test(trimmed);
    },
    message: "Title must be between 3 and 100 characters and cannot contain only numbers",
  },
  location: {
    validate: (val) => val.trim().length >= 2 && val.trim().length <= 200,
    message: "Location must be between 2 and 200 characters",
  },
  description: {
    validate: (val) => val.trim().length >= 10 && val.trim().length <= 2000,
    message: "Description must be at least 10 characters",
  },
  uniqueFeature: {
    validate: (val) => val.trim().length >= 5 && val.trim().length <= 500,
    message: "Unique distinguishing feature must be at least 5 characters",
  },
};

function showFieldError(field, message) {
  clearFieldError(field);
  field.style.borderColor = "var(--red-500)";
  field.style.backgroundColor = "var(--red-50)";

  const errorDiv = document.createElement("div");
  errorDiv.className = "client-error-msg";
  errorDiv.style.color = "var(--red-600)";
  errorDiv.style.fontSize = "12px";
  errorDiv.style.marginTop = "4px";
  errorDiv.style.fontWeight = "500";
  errorDiv.textContent = message;

  field.parentElement.appendChild(errorDiv);
}

function clearFieldError(field) {
  field.style.borderColor = "";
  field.style.backgroundColor = "";
  const parent = field.parentElement;
  if (parent) {
    const existing = parent.querySelector(".client-error-msg");
    if (existing) existing.remove();
  }
}

/**
 * Validate an individual form field
 */
function validateField(field) {
  const type = field.getAttribute("data-validate");
  const rule = validationRules[type];
  if (!rule) return true;

  const value = field.value || "";

  if (field.hasAttribute("required") && value.trim() === "") {
    showFieldError(field, "This field is required");
    return false;
  }

  if (value.trim() !== "" && !rule.validate(value)) {
    showFieldError(field, rule.message);
    return false;
  }

  clearFieldError(field);
  return true;
}

/**
 * Validate a whole form
 */
function validateForm(form) {
  let isValid = true;

  // Validate inputs with data-validate
  form.querySelectorAll("[data-validate]").forEach((field) => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  // Validate image file upload if present
  const fileInput = form.querySelector('input[type="file"]');
  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      if (typeof showToast === "function") showToast("Image must be JPG, PNG, or WEBP", "error");
      isValid = false;
    } else if (file.size > 5 * 1024 * 1024) {
      if (typeof showToast === "function") showToast("File size cannot exceed 5MB", "error");
      isValid = false;
    }
  }

  return isValid;
}

document.addEventListener("DOMContentLoaded", () => {
  // Attach live input feedback
  document.querySelectorAll("[data-validate]").forEach((field) => {
    field.addEventListener("input", () => validateField(field));
    field.addEventListener("blur", () => validateField(field));
  });
});
