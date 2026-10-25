/**
 * api.js
 * Adapter Komunikasi Dinamis ke Database Google Apps Script
 * Tanpa URL Hardcoded di Repository
 */

var ApiService = (function() {
  var STORAGE_KEY = (window.APP_CONFIG && window.APP_CONFIG.STORAGE_KEY_API_URL) 
    ? window.APP_CONFIG.STORAGE_KEY_API_URL 
    : 'SAG_DYNAMIC_API_URL';

  /**
   * Mengambil URL endpoint backend aktif dari Local Storage
   */
  function getApiUrl() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
    return (window.APP_CONFIG && window.APP_CONFIG.API_URL) ? window.APP_CONFIG.API_URL.trim() : '';
  }

  /**
   * Menyimpan URL endpoint khusus ke Local Storage
   */
  function setApiUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEY, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Menghapus konfigurasi koneksi database
   */
  function disconnectDatabase() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Memeriksa apakah database sudah tersambung
   */
  function isConfigured() {
    var url = getApiUrl();
    return Boolean(url && url.indexOf('script.google.com') !== -1 && url.indexOf('/exec') !== -1);
  }

  /**
   * Menguji konektivitas ke URL backend tertentu sebelum disimpan
   * @param {string} targetUrl - URL Google Apps Script yang diuji
   * @return {Promise<Object>}
   */
  function testConnection(targetUrl) {
    if (!targetUrl || targetUrl.indexOf('script.google.com') === -1 || targetUrl.indexOf('/exec') === -1) {
      return Promise.reject(new Error('Format URL tidak valid. Pastikan berakhiran "/exec" dari Google Apps Script.'));
    }

    return fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ping' })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Server mengembalikan HTTP ' + res.status);
      return res.json();
    })
    .catch(function(err) {
      // Coba pengujian fallback GET
      var getUrl = targetUrl + (targetUrl.indexOf('?') === -1 ? '?' : '&') + 'action=ping';
      return fetch(getUrl)
        .then(function(r) { return r.json(); })
        .catch(function() {
          throw new Error('Tidak dapat terhubung ke endpoint ini. Pastikan deployment diatur "Who has access: Anyone".');
        });
    });
  }

  /**
   * Menjalankan RPC Request ke Backend
   */
  function request(action, payload) {
    payload = payload || {};
    payload.action = action;

    // Jika diakses di dalam container bawaan GAS
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise(function(resolve, reject) {
        var runner = google.script.run
          .withSuccessHandler(function(res) { resolve(res); })
          .withFailureHandler(function(err) { reject(err); });

        if (typeof runner.handleApiRequest === 'function') {
          runner.handleApiRequest(action, payload);
        } else {
          reject(new Error('Handler backend lokal tidak siap.'));
        }
      });
    }

    // Eksekusi eksternal via fetch
    var url = getApiUrl();
    if (!isConfigured()) {
      return Promise.reject(new Error('Koneksi database belum diatur. Silakan sambungkan database Anda terlebih dahulu.'));
    }

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ': Server tidak dapat dihubungi.');
      return res.json();
    })
    .catch(function(err) {
      console.warn('[ApiService Error]', err.message);
      throw err;
    });
  }

  return {
    request: request,
    getApiUrl: getApiUrl,
    setApiUrl: setApiUrl,
    disconnectDatabase: disconnectDatabase,
    isConfigured: isConfigured,
    testConnection: testConnection
  };
})();
