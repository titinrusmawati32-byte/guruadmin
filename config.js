/**
 * config.js
 * Konfigurasi Sistem Administrasi Guru SD
 * 
 * CATATAN KEAMANAN & PRIVASI:
 * File ini TIDAK memuat URL database atau Spreadsheet ID yang tertanam.
 * Seluruh endpoint dikonfigurasi secara dinamis oleh pengguna melalui antarmuka
 * dan disimpan secara lokal pada browser pengguna masing-masing.
 */

window.APP_CONFIG = {
  // Kosong secara default agar tidak ada URL database yang tertanam di GitHub
  API_URL: "",

  APP_TITLE: "Sistem Administrasi Guru SD",
  APP_VERSION: "1.0.0-foundation",
  
  // Kunci Penyimpanan Lokal Peramban
  STORAGE_KEY_TOKEN: "SAG_AUTH_TOKEN_V1",
  STORAGE_KEY_THEME: "SAG_THEME_PREF",
  STORAGE_KEY_API_URL: "SAG_DYNAMIC_API_URL"
};
