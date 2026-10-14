# Kaycee CEP Panel for Adobe After Effects ✨

[![After Effects](https://img.shields.io/badge/Adobe%20After%20Effects-2020%20--%202024%2B-9999FF?style=flat&logo=adobeaftereffects&logoColor=white)](https://www.adobe.com/products/aftereffects.html)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-00F0FF?style=flat)](#)
[![Interface](https://img.shields.io/badge/UI-Modern%20Glassmorphism-a855f7?style=flat)](#)

**Kaycee CEP** adalah extension panel serbaguna dan modern untuk Adobe After Effects yang dirancang untuk mempercepat alur kerja (*workflow*) editing & motion graphics. Dilengkapi dengan antarmuka **Glassmorphism**, kustomisasi tema dinamis, video/image background, **Top Navbar navigasi tab**, **AI Audio Separation (Vocal/Music)**, serta tombol cepat 1-klik untuk pengaturan komposisi dan layer.

---

## 🚀 Fitur Utama

### 🧭 Top Navigation Bar (Segmented Tabs)
The panel features a sleek top navigation bar to keep workflows clean and organized:
* **✨ Tools (Main Tools)**: Houses all core composition, comp size, comp FPS, and layer management tools.
* **🎵 Audio AI (Vocal & Music Separation)**: Dedicated AI-powered tab to isolate vocals and instrumental stems from any active video or audio layer in After Effects!

---

### 1. 🎵 AI Audio Separator (Vocal & Music Stems)
Separate vocals and instrumental tracks directly from timeline audio/video layers with 1 click:
* **🚀 1-Click Engine Auto-Setup (Zero CMD)**:
  * Non-technical users do not need to open CMD, install Python, or configure PATH manually!
  * Click **`🚀 1-Click Engine Auto-Setup`** in the panel, and it will silently download and configure the AI engine in the background.
* **⚡ Quality Modes**:
  * **⚡ Fast Quality**: Ultra-fast separation, very low resource usage (~2GB VRAM/CPU), ideal for draft and quick timeline editing.
  * **👑 Studio Quality**: State-of-the-Art Transformer model. Crystal-clear vocal isolation with pristine clarity.
* **Automatic Layer Creation**:
  * Automatically creates synced layers in After Effects named:
    * `Vocal Fast Quality` / `Vocal Studio Quality`
    * `Music Fast Quality` / `Music Studio Quality`
  * Optional checkbox to automatically mute the original video/audio layer.

---

### 2. 📐 Composition Quick Tools
* **Pre-Comp**:
  * **Klik Biasa**: Melakukan Pre-Compose pada setiap layer terpilih secara terpisah (satu per satu).
  * **Shift + Klik**: Menggabungkan seluruh layer terpilih ke dalam satu Pre-Comp bersamaan.
* **M / T (Motion / Twixtor)**:
  * **Klik Biasa**: Menambahkan efek **Twixtor Pro** ke layer.
  * **Shift + Klik**: Menambahkan efek **Motion Tile** dengan pengaturan otomatis.
* **Trim Remap**:
  * Memotong out-point layer terpilih tepat di keyframe Time Remap terakhir secara otomatis.

---

### 2. 🖥️ Comp Size (Ubah Resolusi Komposisi 1-Klik)
Ubah rasio dan ukuran komposisi yang sedang aktif di After Effects secara instan tanpa perlu membuka Composition Settings (`Ctrl + K`).
* **Preset Bawaan 1-Klik**:
  * `16:9` (1920 × 1080)
  * `9:16` (1080 × 1920 - Reels / TikTok / Shorts)
  * `1:1` (1080 × 1080 - Instagram Post)
  * `4:5` (1080 × 1350 - Portrait Feed)
* **Tambah Preset Kustom (`+ Preset`)**:
  * Masukkan nama & resolusi (Lebar × Tinggi) kustom (misal: 4K `3840×2160`, Ultrawide `2560×1080`).
  * Tombol **"Get Active"**: Otomatis mendeteksi dan mengambil resolusi dari komposisi yang sedang terbuka di AE.
  * Hapus preset dengan klik tanda **✕** merah atau **Klik Kanan** pada tombol.
  * Tombol **"Defaults"** untuk mengembalikan preset ke setelan awal.

---

### 3. ⏱️ Comp FPS (Ubah Frame Rate Komposisi 1-Klik)
Ganti frame rate (FPS) komposisi aktif secara instan dengan 1 kali klik.
* **Preset Bawaan 1-Klik**:
  * `24 fps` (Film standard)
  * `25 fps` (PAL standard)
  * `30 fps` (Web / NTSC)
  * `60 fps` (Smooth 60fps)
* **Tambah Preset FPS Kustom (`+ FPS`)**:
  * Tambahkan nilai FPS kustom (misal: `23.976`, `29.97`, `50`, `59.94`, `120`).
  * Berikan label opsional (misal: *Film*, *PAL*, *SlowMo*).
  * Tombol **"Get Active"**: Otomatis membaca frame rate komposisi aktif dari AE.
  * Hapus preset dengan tombol **✕** atau **Klik Kanan**.

---

### 4. 📑 Layer Management
* **NULL / ADJ**:
  * **Klik Biasa**: Menambahkan Null Object baru dan otomatis mem-parent layer yang sedang terpilih ke Null tersebut.
  * **Shift + Klik**: Menambahkan Adjustment Layer dengan durasi yang pas mengikuti panjang layer terpilih.
* **SLD / CMRA**:
  * **Klik Biasa**: Membuat Solid layer putih (+ Tint effect) yang panjang durasinya otomatis menyesuaikan layer terpilih.
  * **Shift + Klik**: Menambahkan Camera 3D baru dengan span in-point & out-point yang sesuai layer terpilih.
* **Fit to Comp**:
  * **Klik Biasa**: Menyesuaikan lebar layer ke lebar komposisi (menjaga aspek rasio).
  * **Shift + Klik**: Menyesuaikan tinggi layer ke tinggi komposisi.
* **Opacity Quick Slider**:
  * Masukkan nilai opacity (0 - 100%) dan klik **Opacity** untuk menerapkannya langsung ke semua layer terpilih.

---

### 5. 🎯 D-Pad 9-Arah (Anchor Point & Align)
Tombol D-Pad 9 arah (`↖`, `↑`, `↗`, `←`, `◎`, `→`, `↙`, `↓`, `↘`):
* Menyelaraskan Anchor Point / posisi layer terpilih ke 9 titik referensi:
  * Pojok Kiri Atas, Tengah Atas, Pojok Kanan Atas
  * Kiri Tengah, **Pusat Titik Tengah (Center ◎)**, Kanan Tengah
  * Pojok Kiri Bawah, Tengah Bawah, Pojok Kanan Bawah

---

### 6. 🛠️ Footer Tools
* 🗑️ **Delete**: Menghapus layer yang sedang dipilih.
* 🛡️ **Lock/Unlock**: Mengunci atau membuka kunci (*toggle lock*) layer terpilih.
* ⚙️ **Settings**: Membuka panel kustomisasi tampilan extension.

---

### 7. 🎨 Tampilan & Kustomisasi (Settings Drawer)
Panel kustomisasi modern berbasis Glassmorphism:
* **Background Media**:
  * Pasang gambar latar belakang kustom (PNG, JPG, WebP) atau **Video Latar Belakang** (MP4 looping).
  * Menggunakan IndexedDB sehingga media berukuran besar tetap tersimpan dan tidak hilang saat AE ditutup.
* **Efek Blur & Transparansi**:
  * **Background Blur**: Mengatur intensitas efek blur kaca (0 - 40px).
  * **Dark Overlay**: Mengatur kepekatan lapisan gelap di atas background (0 - 100%).
  * **Button Frost Blur**: Mengatur keburaman kaca tombol panel.
* **Theme Accent Color**:
  * Pilihan warna bebas menggunakan Color Picker atau Preset Tema:
    * 🟣 Lavender (#7b8fff)
    * 🔵 Cyber Cyan (#00f0ff)
    * 🔴 Hot Pink (#ff3b81)
    * 🟣 Purple Neon (#a855f7)
    * 🟢 Emerald (#10b981)
    * 🟡 Amber Sunset (#f59e0b)
* **Reset All**: Mengembalikan seluruh preferensi visual & preset ke setelan pabrik.

---

## 📥 Panduan Instalasi

### 1. Salin Folder Ekstensi
Salin folder `Kaycee-CEP` ke direktori ekstensi CEP Adobe Anda:

* **Windows**:
  ```text
  C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\Kaycee-CEP
  ```
  *atau untuk user saat ini saja:*
  ```text
  C:\Users\<NamaUser>\AppData\Roaming\Adobe\CEP\extensions\Kaycee-CEP
  ```

* **macOS**:
  ```text
  ~/Library/Application Support/Adobe/CEP/extensions/Kaycee-CEP
  ```

---

### 2. Aktifkan Mode Debug CEP (PlayerDebugMode)

Agar After Effects mengizinkan ekstensi yang belum ditandatangani (*unsigned*) berjalan:

#### Windows:
1. Buka **Command Prompt (CMD)** atau **PowerShell** as Administrator.
2. Jalankan perintah berikut (sesuaikan versi AE Anda):
   ```cmd
   reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f
   reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
   reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
   ```

#### macOS:
Buka Terminal dan jalankan:
```bash
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

---

### 3. Buka di After Effects
1. Buka **Adobe After Effects**.
2. Masuk ke menu atas: **Window** > **Extensions** > **Kaycee**.
3. Panel siap digunakan!

---

## 📂 Struktur File

```text
Kaycee-CEP/
├── CSXS/
│   └── manifest.xml       # Konfigurasi ekstensi CEP & kompatibilitas AE
├── css/
│   └── style.css          # Desain visual UI, Glassmorphism, layout grid
├── fonts/                 # File font lokal (DM Sans, Syne)
├── js/
│   ├── CSInterface.js     # Library penghubung CEP dengan After Effects
│   └── main.js            # Logika panel, event handlers, & state management
├── jsx/
│   └── main.jsx           # ExtendScript host untuk manipulasi AE Project
├── index.html             # Tampilan utama panel CEP
└── README.md              # Dokumentasi lengkap
```

---

## 💡 Tips & Trik
* **Undo Aman**: Setiap perubahan ukuran comp, FPS, solid, dan efek yang dibuat oleh tombol panel dapat di-undo langsung via `Ctrl + Z` di After Effects.
* **Shortcut Shift**: Perhatikan tombol `Pre-Comp`, `M / T`, `NULL / ADJ`, `SLD / CMRA`, dan `Fit to Comp` karena memiliki fungsi sekunder ketika ditekan bersama tombol **Shift**.
* **Quick Delete**: Buka menu `+ Preset` atau `+ FPS` untuk menampilkan tombol hapus (✕) merah pada setiap preset tombol.

---

## 👤 Author
Dibuat dengan ❤️ oleh **maulfx** / **Kaycee**.
