/**
 * config.js
 * Konfigurasi Frontend Eksternal (GitHub Pages / Standalone Web)
 * Sistem Administrasi Guru SD
 */

window.APP_CONFIG = {
  // Ganti nilai ini dengan Web App URL dari deployment Google Apps Script Anda:
  // Contoh: https://script.google.com/macros/s/AKfycbx.../exec
  API_URL: "https://script.google.com/macros/s/YOUR_GAS_DEPLOYMENT_ID/exec",

  APP_TITLE: "Sistem Administrasi Guru SD",
  APP_VERSION: "1.0.0-foundation",
  
  // Kunci Penyimpanan Lokal
  STORAGE_KEY_TOKEN: "SAG_AUTH_TOKEN_V1",
  STORAGE_KEY_THEME: "SAG_THEME_PREF"
};
