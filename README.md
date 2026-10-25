# FRONTEND SISTEM ADMINISTRASI GURU SD (GITHUB PAGES READY)

Direktori ini berisi kode antarmuka web mandiri (HTML, CSS, JavaScript) untuk **Sistem Administrasi Guru SD** yang telah dimigrasikan agar siap di-push ke repository GitHub dan di-host melalui **GitHub Pages**.

---

## 1. Struktur File Frontend

```
frontend/
├── index.html        # Entry point halaman web mandiri
├── config.js         # Pengaturan URL API backend Google Apps Script
├── css/
│   └── styles.css    # Tema Modern Academic Workspace (Indigo & Teal, Mode Gelap/Terang)
├── js/
│   ├── api.js        # Adapter HTTP fetch (CORS-friendly ke GAS Web App)
│   └── app.js        # Logika aplikasi, state controller, toast, modals, views
└── README.md         # Panduan deployment GitHub
```

---

## 2. Cara Menghubungkan ke Backend Google Apps Script

1. Pastikan Anda telah menerapkan (Deploy) backend di Google Apps Script sebagai Web App:
   - **Execute as**: `Me (email anda)`
   - **Who has access**: `Anyone`
2. Salin tautan **Web App URL** yang berakhiran `/exec`  
   Contoh: `https://script.google.com/macros/s/AKfycbw.../exec`
3. Terdapat **2 cara** memasukkan URL tersebut ke frontend:
   - **Cara A (Kode)**: Buka file `config.js` dan ganti nilai `API_URL` dengan Web App URL Anda.
   - **Cara B (Langsung di Tampilan)**: Buka halaman `index.html` di browser -> klik tombol **⚙️ Atur Endpoint API** pada layar login -> masukkan URL Anda -> Simpan (tersimpan otomatis di browser).

---

## 3. Langkah Migrasi & Push ke GitHub

Jika Anda ingin mengunggah folder `frontend` ini ke repositori GitHub baru atau ke branch `gh-pages`:

### Opsi 1: Menjadikan Folder `frontend` Sebagai Repositori Sendiri
Buka terminal di folder `frontend`:
```bash
cd c:\Users\freza\Documents\antigravity\sistem-administrasi-guru-sd\frontend

# Inisialisasi Git
git init
git add .
git commit -m "feat: inisialisasi frontend mandiri Sistem Administrasi Guru SD"

# Hubungkan ke repository GitHub Anda
git branch -M main
git remote add origin https://github.com/USERNAME/REPO-FRONTEND-ANDA.git
git push -u origin main
```

### Opsi 2: Mengaktifkan GitHub Pages
1. Buka halaman repositori Anda di GitHub (`https://github.com/USERNAME/REPO-ANDA`).
2. Masuk ke tab **Settings** > **Pages** di menu bilah kiri.
3. Pada bagian **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: Pilih `main` dan folder `/ (root)`
   - Klik **Save**.
4. Dalam 1-2 menit, GitHub Pages akan menerbitkan situs Anda dengan alamat:  
   `https://USERNAME.github.io/REPO-ANDA/`

---

## 4. Keamanan & Isolasi

- **Tanpa Secret di Frontend**: Frontend tidak menyimpan kunci rahasia backend (`APP_SECRET`) maupun password plaintext.
- **HMAC Session Validation**: Token sesi ditandatangani dan divalidasi oleh backend Google Apps Script.
- **CORS Friendly**: Komunikasi menggunakan `fetch` POST dengan body `text/plain` terstruktur yang sepenuhnya kompatibel dengan arsitektur Google Apps Script tanpa hambatan preflight request.
