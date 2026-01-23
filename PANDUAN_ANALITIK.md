# Panduan Penggunaan Analitik Kehadiran

## 🎯 Daftar Fitur Baru

### 1. Filter Dropdowns yang Berfungsi
- ✅ **Guru (Teacher)** - Pilih guru spesifik untuk analisis
- ✅ **Kelas (Class)** - Pilih kelas spesifik untuk analisis  
- ✅ **Bulan (Month)** - Pilih bulan laporan (Januari - Desember)
- ✅ **Tahun (Year)** - Pilih tahun (2024, 2025, 2026)

### 2. Kartu Ringkasan (Summary Cards)
Menampilkan statistik utama dengan 4 kartu warna:

| Kartu | Warna | Isi |
|-------|-------|-----|
| Total Kehadiran | Biru | Jumlah total data kehadiran |
| Hadir | Hijau | Jumlah guru yang hadir + % |
| Tugas | Oranye | Jumlah yang tugas + % |
| Tidak Hadir | Merah | Jumlah tidak hadir + % |

### 3. Grafik Visualisasi

#### 📊 Grafik Doughnut (Pie Chart)
- Menampilkan distribusi kehadiran secara keseluruhan
- Warna: Hijau (Hadir) | Oranye (Tugas) | Merah (Tidak)
- Tooltip: Menampilkan nilai dan persentase saat dihover

#### 📈 Grafik Trend (Line Chart)
- Menampilkan tren kehadiran harian
- 3 garis: Hadir (Hijau) | Tugas (Oranye) | Tidak (Merah)
- X-axis: Tanggal
- Y-axis: Jumlah
- Interaktif: Hover untuk melihat detail

### 4. Tabel Performa Guru
Menampilkan per guru:
- Nama guru
- Jumlah hadir, tugas, tidak
- Total dan persentase kehadiran

### 5. Tabel Statistik Kelas
Menampilkan per kelas:
- Nama kelas
- Jumlah hadir, tugas, tidak
- Total dan persentase kehadiran

### 6. Download Excel 📥
Tombol hijau untuk download laporan Excel dengan 4 sheet:
1. **Ringkasan** - Tabel statistik ringkas
2. **Guru** - Detail per guru
3. **Kelas** - Detail per kelas
4. **Data Lengkap** - Semua data mentah (raw data)

## 📋 Langkah-Langkah Penggunaan

### Membuka Analitik
1. Klik menu "Analitik" di sidebar
2. Dashboard analitik akan terbuka

### Filter Data (Opsional)
1. Pilih **Guru** dari dropdown (kosongkan untuk semua)
2. Pilih **Kelas** dari dropdown (kosongkan untuk semua)
3. Pilih **Bulan** dari dropdown (kosongkan untuk semua)
4. Pilih **Tahun** dari dropdown (kosongkan untuk semua)
5. Klik tombol biru **"Analisis"**

### Melihat Hasil
- Kartu ringkasan update otomatis
- Grafik menampilkan data terbaru
- Tabel guru dan kelas terupdate
- Semua angka real-time

### Download Laporan Excel
1. Pilih filter yang diinginkan
2. Klik tombol hijau **"Download Excel"**
3. File `Analitik_Kehadiran_YYYY-MM-DD.xlsx` akan diunduh
4. Buka dengan Excel atau aplikasi spreadsheet

## 🎨 Panduan Membaca Grafik

### Grafik Doughnut
```
              Hadir (Hijau)
                    ╱╲
                   ╱  ╲
         Tugas     ╱    ╲    Tidak
        (Oranye) ╱      ╲   (Merah)
                ╱        ╲
```

### Grafik Trend
```
Jumlah
   │     ┌─── Hadir (Hijau)
   │    ╱│╲
   │   ╱ │ ╲     ┌─── Tugas (Oranye)
   │  ╱  │  ╲   ╱│╲
   │ ╱   │   ╲ ╱ │ ╲   ┌─── Tidak (Merah)
   │╱    │    ╲   │  ╲╱
   └────────────────────────────→ Tanggal
```

## 💡 Tips Penggunaan

1. **Filter Kombinasi**: Anda dapat memilih beberapa filter sekaligus
   - Contoh: Guru "Budi" + Bulan "Januari" = Kehadiran Budi di Januari

2. **Reset Filter**: Kosongkan semua dropdown dan klik Analisis untuk melihat semua data

3. **Excel Format**: File Excel memiliki format profesional dengan:
   - Header tebal
   - Borders dan warna
   - Kolom dengan lebar optimal
   - Persentase otomatis

4. **Mobile Friendly**: Dashboard responsif untuk mobile/tablet
   - Filter berjajar vertikal di mobile
   - Grafik menyesuaikan ukuran layar
   - Touch-friendly buttons

## ⚠️ Catatan Penting

- Data diambil dari database terbaru secara real-time
- Semua filter bersifat opsional (boleh dikosongkan)
- Persentase dihitung dari total data yang difilter
- Excel download mencakup semua data yang terfilter
- Charts otomatis update saat memilih filter baru

## 🔧 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Dropdown kosong | Refresh halaman atau check database |
| Chart tidak muncul | Pastikan data tersedia, klik "Analisis" |
| Excel gagal download | Check koneksi internet, refresh halaman |
| Data tidak berubah | Klik "Analisis" setelah ubah filter |

## 📞 Bantuan Teknis

- Semua fitur menggunakan API `/api/analytics`
- Library: Chart.js 3.9.1 dan XLSX 0.18.5
- Kompatibel dengan Chrome, Firefox, Safari, Edge
- Tidak memerlukan instalasi tambahan
