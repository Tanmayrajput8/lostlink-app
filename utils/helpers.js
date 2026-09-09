const mongoose = require("mongoose");

/**
 * Validates whether a given string is a valid MongoDB ObjectId
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

/**
 * Sanitizes a filename to prevent directory traversal and invalid characters
 * @param {string} filename
 * @returns {string}
 */
const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== "string") return "";
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
};

/**
 * Escapes HTML characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
const escapeHtml = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Formats a Date object or ISO string nicely
 * @param {Date|string} date
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

module.exports = {
  isValidObjectId,
  sanitizeFilename,
  escapeHtml,
  formatDate,
};
