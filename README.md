# Kaycee CEP Panel for Adobe After Effects ✨

[![After Effects](https://img.shields.io/badge/Adobe%20After%20Effects-2020%20--%202024%2B-9999FF?style=flat&logo=adobeaftereffects&logoColor=white)](https://www.adobe.com/products/aftereffects.html)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-00F0FF?style=flat)](#)
[![Interface](https://img.shields.io/badge/UI-Modern%20Glassmorphism-a855f7?style=flat)](#)
[![AI Audio](https://img.shields.io/badge/AI%20Audio-MDX--Net%20%7C%20BS--RoFormer-ff007f?style=flat)](#)

**Kaycee CEP** adalah extension panel serbaguna dan modern untuk Adobe After Effects yang dirancang untuk mempercepat alur kerja (*workflow*) editing & motion graphics. Dilengkapi dengan antarmuka **Glassmorphism**, kustomisasi tema dinamis, video/image background, **Top Navbar navigasi tab**, **AI Audio Separation (Vocal/Music)** bertenaga AI lokal, serta tombol cepat 1-klik untuk pengaturan komposisi dan layer.

---

## 🚀 Fitur Utama

### 🧭 Top Navigation Bar (Segmented Tabs)
Panel dilengkapi dengan navigasi tab atas yang rapi dan terorganisir:
* **✨ Tools (Main Tools)**: Berisi semua alat inti komposisi, manajemen resolusi (Comp Size), frame rate (Comp FPS), dan pengaturan layer.
* **🎵 Audio AI (Vocal & Music Separation)**: Tab khusus bertenaga AI untuk memisahkan vokal dan musik instrumental secara lokal dari layer audio/video apa pun di timeline After Effects!
* **✂️ Bg Remover (AI Image Cutout)**: Tab bertenaga AI lokal untuk menghapus latar belakang gambar/foto (PNG, JPG, PSD, WebP) dengan kualitas sekelas PhotoRoom dan otomatis meletakkannya di timeline!

---

### 1. 🎵 AI Audio Separator (Vocal & Music Isolation)
Pisahkan suara vokal dan musik langsung dari layer timeline After Effects hanya dengan 1 klik tanpa perlu membuka software pihak ketiga (seperti Audacity, FL Studio, atau website pihak ketiga):

* **🚀 1-Click Engine Auto-Setup (Zero CMD / Zero Manual PATH)**:
  * Pengguna tidak perlu membuka CMD, tidak perlu install Python manual, dan tidak perlu repot menyetel Environment Variables (PATH).
  * Cukup klik tombol **`🚀 1-Click Engine Auto-Setup`** di dalam panel (atau klik ganda `bin/setup-engine.bat`). Installer otomatis memasang Python 3.11, paket AI, dan menyiapkan model pemisah.
* **📦 Bundled Portable FFmpeg (`bin/ffmpeg.exe`)**:
  * Panel sudah menyertakan binary portable FFmpeg bawaan di dalam folder extension (`bin/ffmpeg.exe`).
  * 100% *plug-and-play* di komputer mana pun tanpa khawatir error *"FFmpeg not found"* atau *exit code 1*.
* **⚡ 2 Pilihan Kualitas AI**:
  * **⚡ Fast Quality (`UVR-MDX-NET-Voc_FT.onnx`)**:
    * Menggunakan model MDX-Net ONNX ringan (~60 MB).
    * Proses render sangat cepat, hemat RAM/VRAM, ideal untuk *draft editing*, pemotongan ritme video, atau komputer dengan spesifikasi standar.
  * **👑 Studio Quality (`BS-RoFormer`)**:
    * Menggunakan model AI State-of-the-Art **BS-RoFormer** (*Transformer Architecture* - SDR 12.9755 dB).
    * Kualitas standar studio profesional: pemisahan vokal sangat jernih dan trek instrumen **100% bersih tanpa kebocoran vokal (*zero vocal bleed*)**.
* **🎬 Integrasi Otomatis ke Timeline After Effects**:
  * Otomatis mengimpor hasil pemisahan ke project AE dan menyusunnya di atas layer sumber dengan sinkronisasi waktu (*in-point*, *out-point*, dan *start-time*) yang presisi.
  * Nama layer dibuat otomatis dan rapi:
    * `Music Fast Quality` / `Music Studio Quality`
    * `Vocal Fast Quality` / `Vocal Studio Quality`
  * Opsi checkbox untuk otomatis mematikan suara (*mute*) pada layer sumber asli.
* **💡 Tips Memutar Stem di AE**:
  * Karena kedua layer (`Music` dan `Vocal`) dimasukkan ke timeline, keduanya dalam keadaan aktif. Jika ingin mendengarkan instrumental saja, matikan ikon speaker (**Mute**) pada layer `Vocal`, atau klik ikon **Solo** pada layer `Music`.

---

### 2. ✂️ AI Image Background Remover (PhotoRoom-Grade Cutout)
Hapus background foto atau gambar secara instan langsung dari layer After Effects tanpa perlu buka browser atau upload foto ke website pihak ketiga:

* **⚡ 2 Pilihan Kualitas AI**:
  * **⚡ Fast Quality (`u2netp`)**:
    * Model ultra-ringan (~4.5 MB).
    * Proses selesai dalam **1 – 2 detik saja!** Sangat pas untuk *rough cut*, *drafting*, dan aset grafis cepat.
  * **👑 Studio Quality (`BiRefNet` - PhotoRoom Grade)**:
    * Menggunakan arsitektur AI *Dichotomous Image Segmentation* (**BiRefNet**) terbaru 2024–2025.
    * Kualitas potongan sekelas PhotoRoom: sangat presisi pada **helai rambut tipis, bulu halus, tepi transparan, dan detail objek kompleks**.
* **🎯 100% Pixel-Perfect Timeline Integration**:
  * Layer transparan baru otomatis memiliki **Posisi, Skala (Scale), Rotasi, Anchor Point, dan In/Out Point** yang sama persis dengan foto aslinya.
  * Opsi checkbox untuk otomatis menyembunyikan (*Hide / Eye off*) layer foto asli di timeline.
* **🔒 100% Offline & Private**:
  * Semua proses AI berjalan langsung di memori komputer Anda. Tidak ada kuota, tidak ada biaya API, dan data project rahasia Anda tidak pernah dikirim ke internet.

---

### 2. 📐 Composition Quick Tools
* **Pre-Comp**:
  * **Klik Biasa**: Melakukan Pre-Compose pada setiap layer terpilih secara terpisah (satu per satu) dengan penyesuaian durasi dan timing otomatis.
  * **Shift + Klik**: Menggabungkan seluruh layer terpilih ke dalam satu Pre-Comp bersamaan.
* **M / T (Motion / Twixtor)**:
  * **Klik Biasa**: Menambahkan efek **Twixtor Pro** ke layer terpilih.
  * **Shift + Klik**: Menambahkan efek **Motion Tile** dengan pengaturan *Mirror Edges* otomatis.
* **Trim Remap**:
  * Memotong out-point layer terpilih tepat di keyframe Time Remap terakhir secara otomatis.

---

### 3. 🖥️ Comp Size (Ubah Resolusi Komposisi 1-Klik)
Ubah rasio dan ukuran komposisi yang sedang aktif di After Effects secara instan tanpa perlu membuka Composition Settings (`Ctrl + K`).
* **Preset Bawaan 1-Klik**:
  * `16:9` (1920 × 1080 - YouTube / Widescreen)
  * `9:16` (1080 × 1920 - Reels / TikTok / Shorts)
  * `1:1` (1080 × 1080 - Instagram Post)
  * `4:5` (1080 × 1350 - Portrait Feed)
* **Tambah Preset Kustom (`+ Preset`)**:
  * Masukkan nama & resolusi kustom (misal: 4K `3840×2160`, Ultrawide `2560×1080`).
  * Tombol **"Get Active"**: Otomatis membaca resolusi dari komposisi yang sedang terbuka di AE.
  * Hapus preset dengan klik tanda **✕** merah atau **Klik Kanan** pada tombol.
  * Tombol **"Defaults"** untuk mengembalikan preset ke setelan pabrik.

---

### 4. ⏱️ Comp FPS (Ubah Frame Rate Komposisi 1-Klik)
Ganti frame rate (FPS) komposisi aktif secara instan dengan 1 kali klik.
* **Preset Bawaan 1-Klik**:
  * `24 fps` (Standar Sinematik / Film)
  * `25 fps` (Standar PAL)
  * `30 fps` (Standar NTSC / YouTube)
  * `60 fps` (Smooth Gaming / Motion)
* **Tambah Preset FPS Kustom (`+ FPS`)**:
  * Tambahkan nilai FPS kustom (misal: `23.976`, `29.97`, `50`, `59.94`, `120`).
  * Berikan label opsional (misal: *Film*, *PAL*, *SlowMo*).
  * Tombol **"Get Active"**: Otomatis mendeteksi frame rate dari komposisi aktif AE.
  * Hapus preset dengan tombol **✕** atau **Klik Kanan**.

---

### 5. 📑 Layer Management
* **NULL / ADJ**:
  * **Klik Biasa**: Membuat Null Object baru dan otomatis mem-parent semua layer yang sedang terpilih ke Null tersebut.
  * **Shift + Klik**: Membuat Adjustment Layer dengan panjang span in-point & out-point yang sesuai dengan layer terpilih.
* **SLD / CMRA**:
  * **Klik Biasa**: Membuat Solid Layer putih (+ Tint effect) yang panjang durasinya mengikuti layer terpilih.
  * **Shift + Klik**: Menambahkan Camera 3D baru dengan durasi yang pas.
* **Fit to Comp**:
  * **Klik Biasa**: Menyesuaikan lebar layer ke lebar komposisi (*Fit to Comp Width*, menjaga aspek rasio).
  * **Shift + Klik**: Menyesuaikan tinggi layer ke tinggi komposisi (*Fit to Comp Height*).
* **Opacity Quick Slider**:
  * Masukkan nilai opacity (0 - 100%) dan klik **Opacity** untuk menerapkannya langsung ke seluruh layer terpilih.

---

### 6. 🎯 D-Pad 9-Arah (Anchor Point & Alignment)
Tombol D-Pad 9 arah interaktif (`↖`, `↑`, `↗`, `←`, `◎`, `→`, `↙`, `↓`, `↘`):
* Menyelaraskan Anchor Point / posisi layer terpilih ke 9 titik batas:
  * Pojok Kiri Atas, Tengah Atas, Pojok Kanan Atas
  * Kiri Tengah, **Pusat Titik Tengah (Center ◎)**, Kanan Tengah
  * Pojok Kiri Bawah, Tengah Bawah, Pojok Kanan Bawah

---

### 7. 🛠️ Footer Tools & Actions
* 🗑️ **Delete**: Menghapus layer yang sedang dipilih dari timeline.
* 🛡️ **Lock/Unlock**: Mengunci atau membuka kunci (*toggle lock*) layer terpilih.
* ⚙️ **Settings**: Membuka laci kustomisasi antarmuka panel.

---

### 8. 🎨 Tampilan & Kustomisasi (Settings Drawer)
Panel kustomisasi modern berbasis Glassmorphism:
* **Background Media**:
  * Pasang gambar latar belakang kustom (PNG, JPG, WebP) atau **Video Latar Belakang** (MP4 looping).
  * Disimpan menggunakan IndexedDB di browser panel sehingga media tetap tersimpan saat After Effects ditutup dan dibuka kembali.
* **Efek Blur & Transparansi**:
  * **Background Blur**: Mengatur intensitas blur kaca (0 - 40px).
  * **Dark Overlay**: Mengatur kepekatan lapisan gelap di atas background (0 - 100%).
  * **Button Frost Blur**: Mengatur keburaman kaca tombol panel.
* **Theme Accent Color**:
  * Pilihan warna bebas menggunakan Color Picker atau Preset Tema:
    * 🟣 Lavender (`#7b8fff`)
    * 🔵 Cyber Cyan (`#00f0ff`)
    * 🔴 Hot Pink (`#ff3b81`)
    * 🟣 Purple Neon (`#a855f7`)
    * 🟢 Emerald (`#10b981`)
    * 🟡 Amber Sunset (`#f59e0b`)
* **Reset All**: Mengembalikan seluruh preferensi visual & preset ke setelan awal.

---

## 📥 Panduan Instalasi

### 1. Salin Folder Ekstensi
Salin folder `Kaycee-CEP` ke salah satu direktori ekstensi CEP Adobe:

* **Windows (Direkomendasikan - Semua User)**:
  ```text
  C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\Kaycee-CEP
  ```
  *atau untuk User saat ini saja:*
  ```text
  C:\Users\<NamaUser>\AppData\Roaming\Adobe\CEP\extensions\Kaycee-CEP
  ```

* **macOS**:
  ```text
  ~/Library/Application Support/Adobe/CEP/extensions/Kaycee-CEP
  ```

---

### 2. Aktifkan Mode Debug CEP (PlayerDebugMode)

Agar Adobe After Effects mengizinkan ekstensi pihak ketiga berjalan:

#### Windows:
1. Buka **Command Prompt (CMD)** atau **PowerShell** (Run as Administrator).
2. Jalankan perintah berikut:
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

### 3. Setup AI Audio Engine (Opsional / Sekali Saja)
1. Buka Adobe After Effects.
2. Buka panel melalui menu: **Window** > **Extensions** > **Kaycee**.
3. Klik tab **🎵 Audio AI**.
4. Klik tombol **`🚀 1-Click Engine Auto-Setup`**. Sistem akan mengunduh dan menyiapkan mesin AI secara otomatis.
*(Atau Anda dapat langsung menjalankan file `bin/setup-engine.bat` jika ingin memantau proses instalasi melalui jendela Command Prompt).*

---

## 📂 Struktur File Ekstensi

```text
Kaycee-CEP/
├── CSXS/
│   └── manifest.xml       # Konfigurasi ekstensi CEP, versi host AE & Node.js flags
├── bin/
│   ├── ffmpeg.exe         # Portable Standalone FFmpeg (Plug-and-play)
│   ├── remove_bg.py       # Python AI Background Remover (u2netp & BiRefNet)
│   ├── separate.py        # Python entry-point bridge untuk audio-separator CLI
│   ├── setup-engine.bat   # 1-Click installer launcher (Batch file)
│   └── setup-engine.ps1   # PowerShell automated setup script (Python & AI packages)
├── css/
│   └── style.css          # Desain antarmuka Glassmorphism, animations & styling
├── fonts/
│   └── HugMeTight.ttf     # Custom title font
├── js/
│   ├── CSInterface.js     # Library penghubung Adobe CEP dengan After Effects
│   ├── audioSeparator.js  # Engine pemisah audio AI, process spawn & file importer
│   ├── bgRemover.js       # Controller AI Image Cutout, process spawn & timeline align
│   └── main.js            # Logika panel, event handlers, tab navigation, & state
├── jsx/
│   └── main.jsx           # ExtendScript backend untuk manipulasi layer & project AE
├── index.html             # Dokumen tampilan utama panel CEP
└── README.md              # Dokumentasi lengkap
```

---

## 💡 Tips & Troubleshooting

* **Undo Aman (`Ctrl + Z`)**: Setiap perubahan (Pre-Comp, Comp Size, FPS, dan penambahan layer stem vokal/musik) tercatat rapi di History After Effects dan dapat di-undo langsung via `Ctrl + Z`.
* **Vokal Masih Terdengar Setelah Dipisah?**:
  * Periksa timeline AE Anda: ekstensi mengimpor **kedua layer** (`Music` dan `Vocal`). Secara default After Effects mengaktifkan speaker kedua layer.
  * Klik ikon speaker (**Mute**) pada layer `Vocal`, atau klik tombol **Solo** (ikon lingkaran) pada layer `Music`.
* **Ingin Hasil Instrumental 100% Bersih?**:
  * Gunakan opsi **👑 Studio Quality (BS-RoFormer)**. Mode ini menghasilkan pemisahan vokal dan instrumen kualitas studio tanpa ada suara vokal yang bocor (*zero bleed*).
* **AI Image Background Remover (Bg Remover)**:
  * Dilengkapi 2 model AI kelas atas: **✂️ Detail Quality (IS-Net DIS)** (Spesialis helaian rambut halus, bulu, kaca transparan, dan tepian rumit) dan **👑 Ultra Quality (BiRefNet Flagship)** (Model Flagship SOTA untuk objek umum, produk, studio compositing).
  * Layer hasil potongan transparan (*cutout*) otomatis diposisikan presisi persis di atas layer asli di timeline dengan koordinat posisi, scale, anchor point, dan timing yang sama.
* **Pembersihan Cache AI (Audio Stems & Cutout Images)**:
  * File sementara (*temporary*) hasil pemisahan audio dan potongan gambar tersimpan di folder `Temp` sistem.
  * Anda dapat memantau dan menghapus cache kapan saja melalui menu **Preferences (⚙️)** > **AI Temp Cache & Storage** > **Clear Temp Cache**.
  * Panel juga otomatis membersihkan file sementara yang berumur lebih dari 24 jam saat pertama kali dibuka.
* **Shortcut Shift**:
  * Tombol `Pre-Comp`, `M / T`, `NULL / ADJ`, `SLD / CMRA`, dan `Fit to Comp` memiliki fungsi alternatif ketika ditekan bersamaan dengan tombol **Shift**.

---

## 👤 Author
Dibuat dengan ❤️ oleh **maulfx** / **Kaycee**.
