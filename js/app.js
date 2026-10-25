/**
 * app.js
 * Controller Antarmuka Utama Frontend GitHub
 * Sistem Administrasi Guru SD
 */

var App = (function() {
  var state = {
    token: null,
    user: null,
    currentView: 'dashboard',
    theme: 'light',
    usersList: [],
    auditLogs: []
  };

  var cfg = window.APP_CONFIG || {
    STORAGE_KEY_TOKEN: 'SAG_AUTH_TOKEN_V1',
    STORAGE_KEY_THEME: 'SAG_THEME_PREF'
  };

  /**
   * Helper Notifikasi Toast
   */
  function showToast(title, message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    var iconChar = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');

    toast.innerHTML = 
      '<div class="toast-icon">' + iconChar + '</div>' +
      '<div class="toast-content">' +
        '<div class="toast-title">' + sanitizeHTML(title) + '</div>' +
        '<div class="toast-message">' + sanitizeHTML(message) + '</div>' +
      '</div>';

    container.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4000);
  }

  function sanitizeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Manajemen Modal
   */
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  /**
   * Tema Terang / Gelap
   */
  function initTheme() {
    var saved = localStorage.getItem(cfg.STORAGE_KEY_THEME) || 'light';
    setTheme(saved);
  }

  function toggleTheme() {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  function setTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(cfg.STORAGE_KEY_THEME, t);
    var btn = document.getElementById('btn-theme-toggle');
    if (btn) btn.innerHTML = (t === 'dark' ? '☀️' : '🌙');
  }

  /**
   * Inisialisasi Aplikasi & Verifikasi Sesi
   */
  function init() {
    initTheme();
    checkApiConfiguration();

    var savedToken = sessionStorage.getItem(cfg.STORAGE_KEY_TOKEN);
    if (!savedToken) {
      renderLoginScreen();
      return;
    }

    // Verifikasi sesi ke backend
    ApiService.request('verifySession', { token: savedToken })
      .then(function(res) {
        if (res && res.success && res.data && res.data.user) {
          state.token = savedToken;
          state.user = res.data.user;
          renderAppScreen();
        } else {
          sessionStorage.removeItem(cfg.STORAGE_KEY_TOKEN);
          renderLoginScreen();
        }
      })
      .catch(function(err) {
        sessionStorage.removeItem(cfg.STORAGE_KEY_TOKEN);
        renderLoginScreen();
      });
  }

  /**
   * Periksa Konfigurasi URL API
   */
  function checkApiConfiguration() {
    var banner = document.getElementById('api-config-banner');
    if (!ApiService.isConfigured()) {
      if (banner) banner.style.display = 'block';
    } else {
      if (banner) banner.style.display = 'none';
    }
  }

  function openApiConfigModal() {
    var inp = document.getElementById('input-api-url');
    if (inp) inp.value = ApiService.getApiUrl();
    openModal('modal-api-config');
  }

  function handleSaveApiConfig(e) {
    e.preventDefault();
    var val = document.getElementById('input-api-url').value.trim();
    if (!val) {
      alert('URL Endpoint tidak boleh kosong.');
      return;
    }
    ApiService.setApiUrl(val);
    closeModal('modal-api-config');
    checkApiConfiguration();
    showToast('Konfigurasi Disimpan', 'Endpoint API berhasil diperbarui.', 'success');
  }

  /**
   * Layar Login
   */
  function renderLoginScreen() {
    document.getElementById('view-app').style.display = 'none';
    document.getElementById('view-login').style.display = 'flex';
  }

  function handleLogin(event) {
    event.preventDefault();
    if (!ApiService.isConfigured()) {
      openApiConfigModal();
      showToast('Konfigurasi Diperlukan', 'Harap atur URL Deployment Google Apps Script terlebih dahulu.', 'error');
      return;
    }

    var userInp = document.getElementById('login-username');
    var pwdInp = document.getElementById('login-password');
    var btn = document.getElementById('btn-login-submit');

    var username = userInp.value.trim();
    var password = pwdInp.value;

    if (!username || !password) {
      showToast('Peringatan', 'Username dan password wajib diisi.', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Menghubungkan...';

    ApiService.request('login', { username: username, password: password })
      .then(function(res) {
        btn.disabled = false;
        btn.innerHTML = 'Masuk ke Sistem';

        if (res && res.success) {
          state.token = res.data.token;
          state.user = res.data.user;
          sessionStorage.setItem(cfg.STORAGE_KEY_TOKEN, state.token);
          showToast('Selamat Datang', res.message, 'success');
          renderAppScreen();
        } else {
          showToast('Gagal Masuk', (res ? res.message : 'Kredensial salah'), 'error');
        }
      })
      .catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = 'Masuk ke Sistem';
        showToast('Gagal Terhubung', err.message || 'Periksa koneksi atau URL API.', 'error');
      });
  }

  /**
   * Logout
   */
  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      if (state.token) {
        ApiService.request('logout', { token: state.token }).catch(function(){});
      }
      state.token = null;
      state.user = null;
      sessionStorage.removeItem(cfg.STORAGE_KEY_TOKEN);
      showToast('Informasi', 'Anda telah keluar dari aplikasi.', 'info');
      renderLoginScreen();
    }
  }

  /**
   * Layar Aplikasi Utama
   */
  function renderAppScreen() {
    document.getElementById('view-login').style.display = 'none';
    var appView = document.getElementById('view-app');
    appView.style.display = 'flex';

    document.getElementById('current-user-name').innerText = state.user.nama;
    document.getElementById('current-user-role').innerText = state.user.role;
    document.getElementById('current-user-avatar').innerText = (state.user.nama || 'U').charAt(0).toUpperCase();

    var roleBadge = document.getElementById('current-user-role');
    roleBadge.className = 'user-badge ' + (state.user.role === 'ADMIN' ? 'badge-admin' : 'badge-guru');

    var adminNavSection = document.getElementById('admin-nav-section');
    if (adminNavSection) {
      adminNavSection.style.display = (state.user.role === 'ADMIN') ? 'block' : 'none';
    }

    navigateTo('dashboard');
  }

  /**
   * Navigasi Menu
   */
  function navigateTo(viewName) {
    state.currentView = viewName;

    var navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    closeSidebar();

    var contentArea = document.getElementById('main-content-area');
    var pageTitle = document.getElementById('current-page-title');

    if (viewName === 'dashboard') {
      pageTitle.innerText = 'Ringkasan Dashboard';
      renderDashboardView(contentArea);
    } else if (viewName === 'users') {
      if (state.user.role !== 'ADMIN') {
        showToast('Akses Ditolak', 'Hanya Administrator yang dapat mengakses menu ini.', 'error');
        navigateTo('dashboard');
        return;
      }
      pageTitle.innerText = 'Kelola Pengguna';
      renderUsersView(contentArea);
    } else if (viewName === 'audit') {
      if (state.user.role !== 'ADMIN') {
        showToast('Akses Ditolak', 'Hanya Administrator yang dapat mengakses menu ini.', 'error');
        navigateTo('dashboard');
        return;
      }
      pageTitle.innerText = 'Audit Aktivitas Sistem';
      renderAuditView(contentArea);
    }
  }

  /**
   * Views
   */
  function renderDashboardView(container) {
    container.innerHTML = 
      '<div class="stats-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-icon stat-icon-indigo">👤</div>' +
          '<div class="stat-info">' +
            '<span class="stat-label">Pengguna Aktif</span>' +
            '<span class="stat-value" id="stat-user-count">-</span>' +
          '</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-icon stat-icon-teal">🏫</div>' +
          '<div class="stat-info">' +
            '<span class="stat-label">Peran Saya</span>' +
            '<span class="stat-value" style="font-size: 1.15rem;">' + state.user.role + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-icon stat-icon-emerald">⚡</div>' +
          '<div class="stat-info">' +
            '<span class="stat-label">Status Fondasi</span>' +
            '<span class="stat-value" style="font-size: 1.15rem; color: var(--success-500);">SIAP (Tahap 1)</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-header">' +
          '<h2 class="card-title">Selamat Datang di Portal Administrasi Guru SD</h2>' +
          (state.user.role === 'ADMIN' ? '<button class="btn btn-secondary" onclick="App.openSystemHealthModal()">Diagnostik Sistem</button>' : '') +
        '</div>' +
        '<div style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">' +
          '<p>Frontend aplikasi berjalan mandiri dan terhubung secara aman ke backend Google Apps Script & Google Sheets.</p>' +
          '<p style="margin-top: 0.75rem;"><strong>Pengguna:</strong> ' + sanitizeHTML(state.user.nama) + ' (' + state.user.username + ') | <strong>Login:</strong> ' + (state.user.lastLoginAt || 'Sesi Baru') + '</p>' +
        '</div>' +
      '</div>';

    ApiService.request('getInitialData', { token: state.token })
      .then(function(res) {
        if (res && res.success && res.data) {
          var countElem = document.getElementById('stat-user-count');
          if (countElem) {
            countElem.innerText = res.data.settings && res.data.settings.ACTIVE_USERS_COUNT ? res.data.settings.ACTIVE_USERS_COUNT : '1';
          }
        }
      });
  }

  function renderUsersView(container) {
    container.innerHTML = 
      '<div class="card">' +
        '<div class="card-header">' +
          '<h2 class="card-title">Daftar Pengguna Sistem</h2>' +
          '<button class="btn btn-primary" onclick="App.openModal(\'modal-add-user\')">+ Tambah Pengguna</button>' +
        '</div>' +
        '<div class="table-responsive">' +
          '<table class="data-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Username</th>' +
                '<th>Nama Lengkap</th>' +
                '<th>Peran</th>' +
                '<th>Status</th>' +
                '<th>Login Terakhir</th>' +
                '<th>Aksi</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="users-table-body">' +
              '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Memuat data pengguna...</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    loadUsersTable();
  }

  function loadUsersTable() {
    ApiService.request('getUsers', { token: state.token })
      .then(function(res) {
        var tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (!res || !res.success) {
          tbody.innerHTML = '<tr><td colspan="6" style="color: var(--danger-500); text-align: center;">' + (res ? res.message : 'Gagal memuat pengguna') + '</td></tr>';
          return;
        }

        state.usersList = res.data || [];
        if (state.usersList.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada pengguna.</td></tr>';
          return;
        }

        var html = '';
        state.usersList.forEach(function(u) {
          var isActive = u.aktif;
          var statusBadge = isActive 
            ? '<span class="badge-status badge-status-active">● Aktif</span>' 
            : '<span class="badge-status badge-status-inactive">● Nonaktif</span>';
          
          var toggleBtn = (u.id === state.user.id)
            ? '<span style="color: var(--text-muted); font-size: 0.8rem;">(Akun Anda)</span>'
            : '<button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="App.handleToggleUser(\'' + u.id + '\', ' + !isActive + ')">' +
                (isActive ? 'Nonaktifkan' : 'Aktifkan') +
              '</button>';

          var resetPwdBtn = '<button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-left: 0.35rem;" onclick="App.handleResetPasswordPrompt(\'' + u.id + '\', \'' + sanitizeHTML(u.username) + '\')">Reset Sandi</button>';

          html += '<tr>' +
            '<td><strong>' + sanitizeHTML(u.username) + '</strong></td>' +
            '<td>' + sanitizeHTML(u.nama) + '</td>' +
            '<td><span class="user-badge ' + (u.role === 'ADMIN' ? 'badge-admin' : 'badge-guru') + '">' + u.role + '</span></td>' +
            '<td>' + statusBadge + '</td>' +
            '<td style="color: var(--text-muted); font-size: 0.8rem;">' + sanitizeHTML(u.lastLoginAt) + '</td>' +
            '<td>' + toggleBtn + resetPwdBtn + '</td>' +
          '</tr>';
        });

        tbody.innerHTML = html;
      })
      .catch(function(err) {
        var tbody = document.getElementById('users-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="color: var(--danger-500); text-align: center;">Kesalahan koneksi: ' + err.message + '</td></tr>';
      });
  }

  function handleCreateUser(e) {
    e.preventDefault();
    var username = document.getElementById('new-username').value.trim();
    var nama = document.getElementById('new-nama').value.trim();
    var password = document.getElementById('new-password').value;
    var role = document.getElementById('new-role').value;
    var guruId = document.getElementById('new-guru-id').value.trim();
    var btn = document.getElementById('btn-submit-add-user');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

    var payload = { username: username, nama: nama, password: password, role: role, guruId: guruId };

    ApiService.request('createUser', { token: state.token, userData: payload })
      .then(function(res) {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Pengguna';

        if (res && res.success) {
          showToast('Sukses', res.message, 'success');
          closeModal('modal-add-user');
          document.getElementById('form-add-user').reset();
          loadUsersTable();
        } else {
          showToast('Gagal Menambah Pengguna', (res ? res.message : 'Kesalahan input'), 'error');
        }
      })
      .catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Pengguna';
        showToast('Kesalahan Server', err.message, 'error');
      });
  }

  function handleToggleUser(userId, newStatus) {
    var act = newStatus ? 'mengaktifkan' : 'menonaktifkan';
    if (!confirm('Apakah Anda yakin ingin ' + act + ' akun ini?')) return;

    ApiService.request('toggleUserStatus', { token: state.token, userId: userId, status: newStatus })
      .then(function(res) {
        if (res && res.success) {
          showToast('Sukses', res.message, 'success');
          loadUsersTable();
        } else {
          showToast('Gagal Mengubah Status', res.message, 'error');
        }
      })
      .catch(function(err) {
        showToast('Kesalahan', err.message, 'error');
      });
  }

  function handleResetPasswordPrompt(userId, username) {
    var newPwd = prompt('Masukkan kata sandi baru untuk pengguna "' + username + '" (minimal 6 karakter):');
    if (!newPwd) return;

    if (newPwd.length < 6) {
      alert('Kata sandi minimal 6 karakter!');
      return;
    }

    ApiService.request('resetPassword', { token: state.token, userId: userId, newPassword: newPwd })
      .then(function(res) {
        if (res && res.success) {
          showToast('Sukses', res.message, 'success');
        } else {
          showToast('Gagal Reset Password', res.message, 'error');
        }
      })
      .catch(function(err) {
        showToast('Kesalahan', err.message, 'error');
      });
  }

  function renderAuditView(container) {
    container.innerHTML = 
      '<div class="card">' +
        '<div class="card-header">' +
          '<h2 class="card-title">Catatan Audit Aktivitas</h2>' +
          '<button class="btn btn-secondary" onclick="App.loadAuditLogs()">Refresh Log</button>' +
        '</div>' +
        '<div class="table-responsive">' +
          '<table class="data-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Waktu (WIB)</th>' +
                '<th>Pelaku</th>' +
                '<th>Peran</th>' +
                '<th>Aksi</th>' +
                '<th>Entitas</th>' +
                '<th>Rincian</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="audit-table-body">' +
              '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Memuat log aktivitas...</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    loadAuditLogs();
  }

  function loadAuditLogs() {
    ApiService.request('getAuditLogs', { token: state.token, limit: 50 })
      .then(function(res) {
        var tbody = document.getElementById('audit-table-body');
        if (!tbody) return;

        if (!res || !res.success) {
          tbody.innerHTML = '<tr><td colspan="6" style="color: var(--danger-500); text-align: center;">' + (res ? res.message : 'Gagal memuat log audit') + '</td></tr>';
          return;
        }

        var logs = res.data || [];
        if (logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada catatan aktivitas.</td></tr>';
          return;
        }

        var html = '';
        logs.forEach(function(l) {
          html += '<tr>' +
            '<td style="white-space: nowrap; font-size: 0.8rem; color: var(--text-muted);">' + sanitizeHTML(l.timestamp) + '</td>' +
            '<td><strong>' + sanitizeHTML(l.username) + '</strong></td>' +
            '<td><span class="user-badge ' + (l.role === 'ADMIN' ? 'badge-admin' : 'badge-guru') + '">' + l.role + '</span></td>' +
            '<td><code>' + sanitizeHTML(l.action) + '</code></td>' +
            '<td>' + sanitizeHTML(l.entity) + '</td>' +
            '<td style="font-size: 0.8rem; font-family: monospace; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + sanitizeHTML(l.details) + '</td>' +
          '</tr>';
        });

        tbody.innerHTML = html;
      })
      .catch(function(err) {
        var tbody = document.getElementById('audit-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="color: var(--danger-500); text-align: center;">Kesalahan: ' + err.message + '</td></tr>';
      });
  }

  function openSystemHealthModal() {
    openModal('modal-system-health');
    loadSystemHealth();
  }

  function loadSystemHealth() {
    var container = document.getElementById('system-health-body');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><span class="spinner" style="color: var(--primary-600); width: 2rem; height: 2rem;"></span><p style="margin-top: 1rem; color: var(--text-muted);">Memeriksa konektivitas Database & Drive...</p></div>';

    ApiService.request('getSystemHealth', { token: state.token })
      .then(function(res) {
        if (!res || !res.success) {
          container.innerHTML = '<div style="color: var(--danger-500); padding: 1rem;">Gagal memeriksa status: ' + (res ? res.message : 'Unknown error') + '</div>';
          return;
        }

        var data = res.data;
        var ch = data.configHealth;
        var sh = data.schemaHealth;

        var html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
        html += '<div style="padding: 1rem; border-radius: 8px; background-color: var(--bg-subtle);">' +
          '<div style="font-weight: 700; margin-bottom: 0.5rem;">📊 Google Sheets Database</div>' +
          '<div style="font-size: 0.85rem;">Status: ' + (ch.spreadsheet.connected ? '<span style="color: var(--success-500);">● Terhubung</span>' : '<span style="color: var(--danger-500);">● Terputus</span>') + '</div>' +
          '<div style="font-size: 0.85rem; color: var(--text-muted);">Sheet: ' + sanitizeHTML(ch.spreadsheet.name) + '</div>' +
        '</div>';

        html += '<div style="padding: 1rem; border-radius: 8px; background-color: var(--bg-subtle);">' +
          '<div style="font-weight: 700; margin-bottom: 0.5rem;">📁 Google Drive Storage</div>' +
          '<div style="font-size: 0.85rem;">Status: ' + (ch.driveFolder.accessible ? '<span style="color: var(--success-500);">● Dapat Diakses</span>' : '<span style="color: var(--danger-500);">● Tidak Ditemukan</span>') + '</div>' +
          '<div style="font-size: 0.85rem; color: var(--text-muted);">Folder: ' + sanitizeHTML(ch.driveFolder.name) + '</div>' +
        '</div>';

        html += '<div style="padding: 1rem; border-radius: 8px; background-color: var(--bg-subtle);">' +
          '<div style="font-weight: 700; margin-bottom: 0.5rem;">🛡️ Integritas Header Database (' + sh.summary.matchCount + '/' + sh.summary.totalSheets + ' Sheet Cocok)</div>';

        for (var sName in sh.sheets) {
          var sInfo = sh.sheets[sName];
          var badge = sInfo.valid 
            ? '<span style="color: var(--success-500); font-weight: 600;">✓ VALID</span>' 
            : '<span style="color: var(--danger-500); font-weight: 600;">✕ TIDAK VALID</span>';
          html += '<div style="font-size: 0.8rem; display: flex; justify-content: space-between; padding: 0.2rem 0;">' +
            '<span>' + sName + ' (' + sInfo.rowCount + ' baris):</span>' +
            '<span>' + badge + '</span>' +
          '</div>';
        }

        html += '</div></div>';
        container.innerHTML = html;
      })
      .catch(function(err) {
        container.innerHTML = '<div style="color: var(--danger-500); padding: 1rem;">Kesalahan diagnosa: ' + err.message + '</div>';
      });
  }

  function openProfileModal() {
    if (!state.user) return;
    document.getElementById('profile-username').value = state.user.username;
    document.getElementById('profile-nama').value = state.user.nama;
    document.getElementById('profile-old-pwd').value = '';
    document.getElementById('profile-new-pwd').value = '';
    openModal('modal-profile');
  }

  function handleUpdateProfile(e) {
    e.preventDefault();
    var nama = document.getElementById('profile-nama').value.trim();
    var oldPwd = document.getElementById('profile-old-pwd').value;
    var newPwd = document.getElementById('profile-new-pwd').value;
    var btn = document.getElementById('btn-submit-profile');

    if (newPwd && newPwd.length < 6) {
      showToast('Peringatan', 'Password baru minimal 6 karakter.', 'error');
      return;
    }

    if (newPwd && !oldPwd) {
      showToast('Peringatan', 'Masukkan kata sandi saat ini untuk konfirmasi pergantian.', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Menyimpan...';

    var payload = { nama: nama, currentPassword: oldPwd, newPassword: newPwd };

    ApiService.request('updateMyProfile', { token: state.token, profileData: payload })
      .then(function(res) {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Perubahan';

        if (res && res.success) {
          showToast('Sukses', res.message, 'success');
          state.user.nama = res.data.nama;
          document.getElementById('current-user-name').innerText = res.data.nama;
          closeModal('modal-profile');
        } else {
          showToast('Gagal Memperbarui Profil', res.message, 'error');
        }
      })
      .catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Perubahan';
        showToast('Kesalahan', err.message, 'error');
      });
  }

  function toggleSidebar() {
    var sidebar = document.getElementById('app-sidebar');
    var backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && backdrop) {
      sidebar.classList.toggle('sidebar-open');
      backdrop.classList.toggle('active');
    }
  }

  function closeSidebar() {
    var sidebar = document.getElementById('app-sidebar');
    var backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && backdrop) {
      sidebar.classList.remove('sidebar-open');
      backdrop.classList.remove('active');
    }
  }

  return {
    init: init,
    handleLogin: handleLogin,
    handleLogout: handleLogout,
    navigateTo: navigateTo,
    openModal: openModal,
    closeModal: closeModal,
    toggleTheme: toggleTheme,
    toggleSidebar: toggleSidebar,
    closeSidebar: closeSidebar,
    handleCreateUser: handleCreateUser,
    handleToggleUser: handleToggleUser,
    handleResetPasswordPrompt: handleResetPasswordPrompt,
    loadAuditLogs: loadAuditLogs,
    openSystemHealthModal: openSystemHealthModal,
    loadSystemHealth: loadSystemHealth,
    openProfileModal: openProfileModal,
    handleUpdateProfile: handleUpdateProfile,
    openApiConfigModal: openApiConfigModal,
    handleSaveApiConfig: handleSaveApiConfig
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
