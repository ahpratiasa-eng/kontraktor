# 📘 Manual Penggunaan Aplikasi Kontraktor Pro

Selamat datang di **Kontraktor Pro**, solusi manajemen konstruksi cerdas berbasis web. Dokumen ini memandu Anda menggunakan fitur-fitur unggulan aplikasi.

---

## 📋 Daftar Isi
1. [Overview & Dashboard](#1-dashboard-proyek)
2. [Manajemen Proyek & RAB](#2-manajemen-rab--kurva-s)
3. [Fitur Logistik Cerdas (Smart Logistics)](#3-fitur-logistik-cerdas--smart-shopping)
4. [Keuangan & Tim Lapangan](#4-keuangan--tim-lapangan)
5. [AI Assistant & Library AHS](#5-ai-assistant--library-ahs)
6. [Portal Klien (Untuk Pemilik)](#6-portal-klien)

---

## 1. Dashboard Proyek
Halaman utama adalah pusat kendali bisnis Anda.

### Fitur Utama:
*   **Daftar Proyek**: Kartu ringkasan untuk setiap proyek aktif.
*   **Status Progress**: Bar hijau menunjukkan realisasi fisik di lapangan.
*   **Indikator Keuangan**: Bar kecil yang membandingkan budget vs pengeluaran aktual (Merah = Overbudget).
*   **Cuaca Live**: Di pojok kanan atas proyek, ikon cuaca (Hujan/Cerah) membantu Anda memutuskan apakah pekerjaan cor beton bisa dilakukan hari ini.

> **Aksi Cepat**: Klik tombol `Lihat Detail` pada kartu proyek untuk masuk ke menu manajemen lengkap.

---

## 2. Manajemen RAB & Kurva S
Inti dari teknik sipil ada di sini. Masuk ke tab **Kurva S & RAB**.

### Cara Membuat RAB:
1.  **Tambah Item Manual**: Klik `+ Item`, pilih kategori (misal: Pekerjaan Dinding), isi Volume dan Harga Satuan.
2.  **Import Excel**: Jika sudah punya file Excel, klik tombol `Import` dan upload.
3.  **AI Auto-Generate**: Klik `Auto RAB (AI)`, ketik deskripsi proyek *"Rumah Type 36, 1 Kamar Tidur"*. AI akan menyusun item pekerjaan standar untuk Anda.

### Kurva S Otomatis:
Setiap kali Anda mengubah Volume atau Harga, bobot pekerjaan dihitung ulang otomatis. Grafik Kurva S (Rencana vs Realisasi) akan langsung terupdate tanpa perlu rumus Excel.

---

## 3. Fitur Logistik Cerdas & Smart Shopping 🚀
*(Fitur Terbaru)*
Masuk ke tab **Logistik / Bahan**.

### A. Stok Lapangan (Gudang Data)
Digunakan untuk mencatat stok fisik di gudang proyek.
*   **Update Stok**: Klik ikon pensil untuk catat barang masuk (Beli) atau keluar (Pakai).
*   **Peringatan Dini**: Kartu material akan berwarna **MERAH** dan ada label "STOK MENIPIS" jika jumlah di bawah batas minimum.

### B. Rekap Kebutuhan Proyek (Smart Shopping List)
Ini adalah fitur otomatisasi logistik.
*   Klik tombol **"Rekap Kebutuhan Proyek (RAB)"**.
*   Sistem membaca semua ITEM RAB Anda, membongkar Analisa (AHS) di dalamnya, dan menghitung total bahan mentah.
*   **Hasil**: Daftar belanja lengkap (Semen total sekian sak, Pasir sekian kubik).
*   **Traceability**: Kolom kanan menunjukkan bahan tersebut dipakai untuk pekerjaan apa saja.
*   **Cetak**: Klik tombol `Print/PDF` untuk mengirim daftar ini ke Toko Bangunan.

---

## 4. Keuangan & Tim Lapangan
### Keuangan (Finance)
*   **Catat Transaksi**: Input pengeluaran harian (makan, bensin, material darurat).
*   **Filter**: Pisahkan pengeluaran Material vs Upah.
*   **Cashflow**: Grafik pemasukan vs pengeluaran real-time.

### Tim & Absensi
*   **Database Tukang**: Simpan data tukang, gaji harian, dan peran (Mandor/Tukang).
*   **Absensi Harian**: Klik `Isi Absensi`. Bisa tandai Hadir, Setengah Hari, atau Lembur.
*   **Bukti Foto**: Upload foto pekerjaan hari ini. Dilengkapi **Geo-Tagging** (Lokasi GPS) otomatis untuk mencegah mandor bohong lokasi.

---

## 5. AI Assistant & Library AHS 🤖
Masuk ke menu **Library AHS** dari Sidebar.

### Mengelola Harga Dasar dengan Suara/Teks
Anda tidak perlu edit satu-satu. Ketik perintah di kolom AI:
*   *"Naikkan harga semen jadi 65.000"*
*   *"Hapus item batu kali"*
*   *"Tambah upah tukang gali 120.000"*

**Smart Sync**:
Jika Anda mengubah **Harga Dasar** bahan (misal: Harga Semen naik), sistem akan menawarkan tombol **"Sync Semua AHS"**. Sekali klik, ribuan item RAB di semua proyek akan terupdate harganya.

---

## 6. Portal Klien
Fitur untuk menjaga transparansi dengan Pemilik Rumah.
1.  Di Dashboard Proyek, klik tombol **"Portal Klien"**.
2.  Link unik akan disalin. Kirim link ini via WhatsApp ke pemilik rumah.
3.  Pemilik rumah bisa melihat:
    *   Progress Fisik (%)
    *   Foto-foto Galeri Pro proyek.
    *   Kurva S sederhana.
    *   *Catatan: Nilai uang/profit KONTRAKTOR disembunyikan dari pandangan klien.*

---
*Dibuat otomatis oleh Sistem Kontraktor Pro.*
