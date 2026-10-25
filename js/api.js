/**
 * api.js
 * Adapter Komunikasi Frontend ke Google Apps Script Web App API
 * Mendukung eksekusi mandiri (GitHub Pages) via fetch HTTP POST & fallback google.script.run
 */

var ApiService = (function() {
  
  /**
   * Mengambil URL endpoint backend aktif
   */
  function getApiUrl() {
    var custom = localStorage.getItem('SAG_CUSTOM_API_URL');
    if (custom) return custom;
    return (window.APP_CONFIG && window.APP_CONFIG.API_URL) ? window.APP_CONFIG.API_URL : '';
  }

  /**
   * Menyimpan URL endpoint khusus dari UI
   */
  function setApiUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem('SAG_CUSTOM_API_URL', url.trim());
    } else {
      localStorage.removeItem('SAG_CUSTOM_API_URL');
    }
  }

  /**
   * Memeriksa apakah API URL sudah dikonfigurasi dengan benar
   */
  function isConfigured() {
    var url = getApiUrl();
    return Boolean(url && url.indexOf('script.google.com') !== -1 && url.indexOf('YOUR_GAS_DEPLOYMENT_ID') === -1);
  }

  /**
   * Menjalankan RPC API Request.
   * Mendukung CORS-friendly POST ke Apps Script via Content-Type 'text/plain'.
   * 
   * @param {string} action - Nama aksi (contoh: 'login', 'getUsers', dll.)
   * @param {Object} payload - Data payload parameter
   * @return {Promise<Object>}
   */
  function request(action, payload) {
    payload = payload || {};
    payload.action = action;

    // Jika berjalan di dalam container GAS bawaan
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise(function(resolve, reject) {
        // Pemetaan fungsi bawaan GAS jika tersedia
        var runner = google.script.run
          .withSuccessHandler(function(res) { resolve(res); })
          .withFailureHandler(function(err) { reject(err); });

        // Panggil router doPost GAS
        if (typeof runner.handleApiRequest === 'function') {
          runner.handleApiRequest(action, payload);
        } else {
          // Fallback ke pemanggilan spesifik
          var mapFn = {
            'login': function() { runner.apiLogin(payload.username, payload.password); },
            'logout': function() { runner.apiLogout(payload.token); },
            'verifySession': function() { runner.apiVerifySession(payload.token); },
            'getInitialData': function() { runner.apiGetInitialData(payload.token); },
            'getSystemHealth': function() { runner.apiGetSystemHealth(payload.token); },
            'getUsers': function() { runner.apiGetUsers(payload.token); },
            'createUser': function() { runner.apiCreateUser(payload.token, payload.userData); },
            'toggleUserStatus': function() { runner.apiToggleUserStatus(payload.token, payload.userId, payload.status); },
            'resetPassword': function() { runner.apiResetUserPassword(payload.token, payload.userId, payload.newPassword); },
            'getAuditLogs': function() { runner.apiGetAuditLogs(payload.token, payload.limit); },
            'updateMyProfile': function() { runner.apiUpdateMyProfile(payload.token, payload.profileData); }
          };

          if (mapFn[action]) {
            mapFn[action]();
          } else {
            reject(new Error('Aksi ' + action + ' tidak didukung runner lokal.'));
          }
        }
      });
    }

    // Eksekusi eksternal (GitHub Pages / Standalone Web)
    var url = getApiUrl();
    if (!isConfigured()) {
      return Promise.reject(new Error('URL Deployment Google Apps Script belum dikonfigurasi. Silakan atur Endpoint API terlebih dahulu.'));
    }

    // Kirim dengan mode text/plain untuk menghindari CORS Preflight (OPTIONS) di browser
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (!res.ok) {
        throw new Error('Server mengembalikan status HTTP ' + res.status);
      }
      return res.json();
    })
    .catch(function(err) {
      Logger('Fetch API Error: ' + err.message);
      throw err;
    });
  }

  function Logger(msg) {
    if (window.console && console.warn) {
      console.warn('[ApiService]', msg);
    }
  }

  return {
    request: request,
    getApiUrl: getApiUrl,
    setApiUrl: setApiUrl,
    isConfigured: isConfigured
  };
})();
