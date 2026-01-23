# 📚 Panduan Dokumen Digital Kurikulum

**Status**: ✅ SIAP DIGUNAKAN
**Tanggal**: 23 Januari 2026

---

## 🎯 Apa Yang Dilakukan

✅ Mengganti menu "Kalender" dengan "**Dokumen Digital Kurikulum**"
✅ Menampilkan semua PDF dari folder Google Drive Anda
✅ File dapat diunduh langsung
✅ File baru otomatis muncul ketika ditambah di Google Drive

---

## 🚀 Cara Kerja

### Untuk Pengguna:
1. Klik menu **"Dokumen Digital Kurikulum"** di halaman utama
2. Muncul daftar dokumen dari Google Drive
3. Cari dokumen yang diinginkan
4. Klik **"Unduh"** untuk mengunduh atau **"Pratinjau"** untuk melihat

### Untuk Administrator:
1. Buka folder Google Drive
2. Upload file PDF
3. Selesai! File otomatis muncul dalam menu dalam 5 menit

---

## 📋 Fitur-Fitur

### 🔍 Pencarian
- Ketik nama dokumen
- Hasil langsung saat mengetik
- Tidak perlu tekan Enter

### 🏷️ Filter
- **Semua**: Tampilkan semua dokumen
- **Terbaru**: Dokumen terbaru di atas
- **A-Z**: Urutan abjad

### 📥 Unduh
- Tombol "Unduh" berwarna hijau
- Langsung ke Google Drive
- Satu klik untuk mengunduh

### 👁️ Pratinjau
- Tombol "Pratinjau" berwarna biru
- Lihat PDF di browser
- Tidak perlu unduh dulu

### 📱 Mobile-Friendly
- Responsif di semua ukuran layar
- Tombol besar untuk HP
- Nyaman digunakan di ponsel

---

## 📍 Link Google Drive

**Folder ID**: `1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO`

**Link**: https://drive.google.com/drive/folders/1ZeQnYBcQqJZ3_E2FRU9igtKdtknCm9gO?usp=sharing

---

## 📝 Cara Menambah Dokumen

### Langkah-langkah:
1. **Buka Google Drive**
2. **Cari folder kurikulum** (gunakan link di atas)
3. **Klik tombol "+ Folder Baru"** atau **"Upload Files"**
4. **Pilih file PDF**
5. **Tunggu selesai upload**
6. **Selesai!** ✨

### File otomatis muncul dalam:
- ⏱️ 5 menit pertama kali
- ⏱️ 1-2 menit untuk update berikutnya
- 👥 Semua pengguna bisa lihat

---

## 💻 Instalasi & Setup

### Langkah 1: Cek Instalasi
```bash
npm list googleapis
```

Jika tidak ada, install:
```bash
npm install googleapis
```

### Langkah 2: Restart Server
```bash
# Tekan Ctrl+C untuk stop
# Kemudian jalankan:
npm start
```

### Langkah 3: Buka Website
```
http://localhost:3000
```

Klik menu **"Dokumen Digital Kurikulum"** → Selesai! ✅

---

## 🌐 Interface

### Tampilan Desktop

```
┌─────────────────────────────────────────────┐
│ 🎓 Kurikulum Smansaba                      │
├─────────────────────────────────────────────┤
│                                              │
│ 📄 Dokumen Digital Kurikulum                │
│ Akses lengkap dokumen kurikulum dalam PDF   │
│                                              │
│ 📊 5 Dokumen                                │
│                                              │
│ 🔍 [Cari dokumen...]                        │
│                                              │
│ [Semua] [Terbaru] [A-Z]                    │
│                                              │
│ ┌─────────────┬─────────────┬─────────────┐│
│ │ 📄 Silabus  │ 📄 RPP      │ 📄 SK-KD    ││
│ │ 15 Jan      │ 20 Jan      │ 25 Jan      ││
│ │ 245 KB      │ 512 KB      │ 89 KB       ││
│ │[Unduh]      │[Unduh]      │[Unduh]      ││
│ │[Pratinjau]  │[Pratinjau]  │[Pratinjau]  ││
│ └─────────────┴─────────────┴─────────────┘│
│                                              │
└─────────────────────────────────────────────┘
```

### Tampilan Mobile

```
┌──────────────────┐
│ ☰ | Kurikulum   │
├──────────────────┤
│                  │
│ 📄 Dokumen       │
│                  │
│ 📊 5 Dokumen     │
│                  │
│ 🔍 [Cari...]     │
│                  │
│ [Semua] [Baru]   │
│                  │
│ ┌──────────────┐ │
│ │ 📄 Silabus  │ │
│ │ 15 Jan      │ │
│ │ 245 KB      │ │
│ │ [Unduh]     │ │
│ │ [Pratinjau] │ │
│ └──────────────┘ │
│                  │
│ ┌──────────────┐ │
│ │ 📄 RPP      │ │
│ │ 20 Jan      │ │
│ │ 512 KB      │ │
│ │ [Unduh]     │ │
│ │ [Pratinjau] │ │
│ └──────────────┘ │
│                  │
└──────────────────┘
```

---

## 📊 Sinkronisasi Otomatis

### Bagaimana cara kerjanya?

```
Setiap 5 menit:
  1. Sistem otomatis cek Google Drive
  2. Ambil daftar file terbaru
  3. Update tampilan jika ada perubahan
  4. Tidak perlu refresh halaman
  5. Pengguna bisa lihat file baru langsung
```

### Contoh Alur:
```
Anda upload: "Silabus_2024.pdf" ke Google Drive
    ↓
Tunggu maksimal 5 menit...
    ↓
"Silabus_2024.pdf" muncul otomatis di menu
    ↓
Siswa/Guru bisa cari, download, atau lihat preview
```

---

## 🎓 Untuk Siswa/Guru/Orang Tua

### Apa Yang Bisa Dilakukan:

✅ **Mencari Dokumen**
- Ketik nama dokumen di kotak pencarian
- Hasil muncul langsung
- Contoh: Ketik "Silabus" → Muncul semua Silabus

✅ **Filter Dokumen**
- Klik "Semua" = semua dokumen
- Klik "Terbaru" = dokumen terbaru di atas
- Klik "A-Z" = urutan abjad

✅ **Mengunduh Dokumen**
- Klik tombol hijau "Unduh"
- File langsung diunduh ke komputer/ponsel
- Buka dengan aplikasi pembaca PDF

✅ **Pratinjau Dokumen**
- Klik tombol biru "Pratinjau"
- Lihat PDF langsung di browser
- Jangan perlu unduh dulu

✅ **Di Ponsel**
- Buka website di browser ponsel
- Semua fitur tetap berfungsi
- Layar otomatis menyesuaikan
- Tombol besar mudah diklik

---

## 🔧 Troubleshooting (Pemecahan Masalah)

### ❌ Dokumen tidak muncul

**Solusi:**
1. Refresh halaman (tekan F5)
2. Tunggu 5 menit untuk sinkronisasi otomatis
3. Cek di folder Google Drive apakah file sudah ada
4. Jika masih tidak muncul, restart server:
   ```bash
   npm start
   ```

### ❌ Tidak bisa mengunduh

**Solusi:**
1. Cek koneksi internet
2. Coba unduh dengan tautan Google Drive langsung
3. Gunakan browser lain (Chrome, Firefox, Safari)
4. Coba mode incognito/private

### ❌ Pratinjau tidak muncul

**Solusi:**
1. Pastikan file adalah PDF asli
2. Coba refresh halaman
3. Gunakan browser terbaru
4. Cek di Google Drive langsung

### ❌ Server tidak bisa dijalankan

**Solusi:**
```bash
# 1. Install package yang hilang
npm install

# 2. Hapus node_modules dan reinstall
rmdir /s node_modules
npm install

# 3. Jalankan server
npm start
```

---

## 🔐 Keamanan & Privasi

✅ **Aman:**
- Folder Google Drive bersifat publik (direncanakan)
- Hanya bisa unduh/lihat (tidak bisa edit)
- Data tidak disimpan di server
- Langsung dari Google Drive

✅ **Privasi:**
- Tidak ada tracking user
- Tidak menyimpan riwayat unduh
- Google handle keamanan file

---

## 📱 Perangkat Yang Didukung

✅ **Komputer:**
- Windows (Chrome, Firefox, Edge)
- Mac (Chrome, Firefox, Safari)
- Linux (Chrome, Firefox)

✅ **Ponsel:**
- iPhone (Safari, Chrome)
- Android (Chrome, Firefox)

✅ **Tablet:**
- iPad (Safari)
- Android Tablet (Chrome)

---

## 📚 Daftar File Contoh

Contoh dokumen yang bisa diupload:
- 📄 Silabus (.pdf)
- 📄 RPP - Rencana Pelaksanaan Pembelajaran (.pdf)
- 📄 SK-KD - Standar Kompetensi dan Kompetensi Dasar (.pdf)
- 📄 Promes - Program Semester (.pdf)
- 📄 Prosem - Program Tahunan (.pdf)
- 📄 Penilaian (.pdf)
- 📄 Distribusi KI-KD (.pdf)
- 📄 Analisis Alokasi Waktu (.pdf)

---

## ✅ Checklist

Sebelum membuka fitur ini, pastikan:

- ✅ Server sudah dijalankan (`npm start`)
- ✅ Browser terbuka ke `http://localhost:3000`
- ✅ Ada koneksi internet
- ✅ Google Drive folder sudah punya file PDF
- ✅ Folder Google Drive bersifat "Dibagikan"

---

## 🎉 Kesimpulan

| Fitur | Status |
|-------|--------|
| Menu Dokumen Digital | ✅ Aktif |
| Sinkronisasi Google Drive | ✅ Otomatis |
| Pencarian Dokumen | ✅ Real-time |
| Filter Dokumen | ✅ Ada |
| Unduh Dokumen | ✅ Langsung |
| Pratinjau PDF | ✅ In-browser |
| Mobile Responsive | ✅ Responsif |
| Update Otomatis | ✅ Setiap 5 menit |

---

## 📞 Bantuan

### Jika Ada Pertanyaan:
1. Lihat dokumentasi di file CURRICULUM_DOCUMENTS_SETUP.md
2. Cek troubleshooting di atas
3. Restart server dan coba lagi

### Jika Masih Ada Masalah:
```bash
# Cek error di console
npm start

# Lihat pesan error yang muncul
# Jika ada error, laporkan ke developer
```

---

**Siap Digunakan!** ✨

Tinggal buka website dan klik menu "Dokumen Digital Kurikulum"

```bash
npm start
# → http://localhost:3000
# → Klik "Dokumen Digital Kurikulum"
```

**Selamat menggunakan!** 🎊
