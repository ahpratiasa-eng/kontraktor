# 📘 Manual Penggunaan Aplikasi Kontraktor Pro

Selamat datang di **Kontraktor Pro** (Guna Karya), solusi manajemen konstruksi cerdas berbasis web. Dokumen ini memandu Anda menggunakan fitur-fitur unggulan aplikasi.

**Versi Dokumentasi:** 2.1 (Desember 2024 - Update Akhir Tahun)

---

## 🔄 Flow Kerja Proyek (Dari Pembuatan Hingga Selesai)

Berikut adalah panduan lengkap alur kerja proyek konstruksi menggunakan aplikasi Guna Karya:

### 📋 FASE 1: PERSIAPAN PROYEK

#### 1.1 Buat Proyek Baru
```
Dashboard → Klik "+ Proyek Baru" → Isi Form
```

**Data yang perlu diisi:**
| Field | Keterangan |
|-------|------------|
| Nama Proyek | Nama yang mudah dikenali |
| Nama Klien | Pemilik/Owner proyek |
| Lokasi | Alamat lengkap proyek |
| Nilai Kontrak | Total nilai proyek (Rp) |
| Tanggal Mulai | Kapan proyek dimulai |
| Target Selesai | Deadline proyek |
| Hero Image | Foto utama proyek (opsional) |

#### 1.2 Setup RAB (Rencana Anggaran Biaya)
```
Detail Proyek → Tab "Kurva S & RAB" → Tambah Item
```

**Tiga cara input RAB:**
1. **Manual**: Tambah item satu per satu
2. **Import Excel**: Upload file RAB dari Excel
3. **AI Generate**: Ketik deskripsi, AI susun item otomatis

**Contoh item RAB:**
- Pekerjaan Pondasi
- Pekerjaan Struktur
- Pekerjaan Dinding
- Pekerjaan Atap
- Finishing

#### 1.3 Atur Jadwal Pekerjaan
```
TiAP Item RAB → Klik Ikon Kalender → Set Tanggal Mulai & Selesai
```

Jadwal akan muncul di **Timeline** sebagai Gantt Chart sederhana.

---

### 💰 FASE 2: PENERIMAAN DANA

#### 2.1 Terima DP (Down Payment)
```
Tab Keuangan → "+ Catat Pemasukan" → Pilih "DP"
```

**Langkah:**
1. Pilih kategori: **DP**
2. Isi nominal yang diterima
3. Upload bukti transfer (wajib)
4. Simpan

#### 2.2 Terima Termin
```
Tab Keuangan → "+ Catat Pemasukan" → Pilih "Termin"
```

Termin biasanya dibayar bertahap sesuai progress:
- Termin 1: 30% (setelah pondasi selesai)
- Termin 2: 60% (setelah struktur selesai)
- Termin 3: 90% (setelah finishing)
- Termin 4: 100% (pelunasan)

---

### 👷 FASE 3: EKSEKUSI LAPANGAN

#### 3.1 Daftarkan Tim Pekerja
```
Tab "Tim & Absensi" → "+ Tambah Tukang"
```

**Data pekerja:**
- Nama & Role (Tukang/Kuli/Mandor)
- Upah Asli (internal) vs Upah Charge (ke klien)
- Sistem upah: Harian/Mingguan/Borongan

#### 3.2 Absensi Harian (WAJIB)
```
Tab "Tim & Absensi" → "Absensi Hari Ini"
```

**Setiap hari wajib:**
1. Pilih tanggal
2. Set status tiap pekerja: Hadir (1) / Setengah (0.5) / Lembur (1.5) / Absen (0)
3. **WAJIB**: Upload foto bukti lapangan
4. **WAJIB**: Lokasi GPS terdeteksi
5. Simpan Absensi

#### 3.3 Kelola Material/Logistik
```
Tab "Logistik" → Update Stok
```

**Aktivitas:**
- Catat material masuk ke proyek
- Catat material terpakai
- Monitor stok menipis (kartu merah)
- Order via WhatsApp jika perlu

#### 3.4 Catat Pengeluaran
```
Tab "Keuangan" → "+ Catat Pengeluaran"
```

**Kategori pengeluaran:**
| Kategori | Contoh |
|----------|--------|
| Material | Beli semen, batu, pasir |
| Upah | Bayar gaji tukang |
| Operasional | Transport, makan, dll |
| Sewa Alat | Sewa molen, scaffolding |
| Lainnya | Biaya tak terduga |

**Tips:** Selalu upload foto struk/nota sebagai bukti!

#### 3.5 Dokumentasi Progress (Foto)
```
Tab "Galeri" → "+ Tambah Foto"
```

Upload foto progress secara rutin untuk:
- Dokumentasi internal
- Bukti progress ke klien
- Arsip jika ada komplain

---

### 📊 FASE 4: MONITORING & REPORTING

#### 4.1 Update Progress Item RAB
```
Tab "Kurva S & RAB" → Klik Item → Update Progress (%)
```

Setiap pekerjaan selesai, update progress:
- 25% - Baru mulai
- 50% - Setengah jalan
- 75% - Hampir selesai
- 100% - Selesai total

#### 4.2 Pantau Kurva S
Kurva S menampilkan:
- **Garis Rencana** (biru): Target progress
- **Garis Realisasi** (hijau): Progress aktual

Jika realisasi di bawah rencana = proyek terlambat!

#### 4.3 Cek Cash Flow
```
Tab "Keuangan" → Lihat "Total Arus Kas"
```

Monitor:
- Total Pemasukan vs Pengeluaran
- Sisa Kas tersedia
- Apakah masih on budget?

#### 4.4 Quality Control (QC)
```
Tab "Mutu (QC)" → Tambah Inspeksi
```

Catat hasil inspeksi:
- Item yang diinspeksi
- Status: Lulus / Gagal
- Catatan perbaikan jika gagal

---

### 📤 FASE 5: TAGIHAN & PEMBAYARAN

#### 5.1 Buat Invoice Termin
```
Tab "Keuangan" → "Invoice & Termin" → "+ Invoice Baru"
```

1. Pilih termin (1/2/3/dst)
2. Isi persentase tagihan
3. Generate PDF invoice (Branding **Guna Karya**)
4. **Minta Approval Klien** (Lihat Section 17)
5. Kirim ke klien

#### 5.2 Bagikan Link Portal Klien
```
Dashboard → Klik "Portal Klien" pada proyek
```

Klien bisa lihat:
- ✅ Progress fisik
- ✅ Foto-foto galeri
- ❌ Nilai keuangan (disembunyikan)

---

### ✅ FASE 6: PENYELESAIAN PROYEK

#### 6.1 Verifikasi Semua Item 100%
Pastikan semua item RAB sudah 100%:
```
Tab "Kurva S & RAB" → Cek semua item hijau
```

#### 6.2 Selesaikan Defect List
```
Tab "Mutu (QC)" → Daftar Temuan → Semua harus "Verified"
```

Pastikan:
- Tidak ada komplain terbuka
- Semua perbaikan sudah di-verifikasi

#### 6.3 Terima Pelunasan
```
Tab "Keuangan" → "+ Catat Pemasukan" → "Pelunasan"
```

Terima sisa pembayaran:
- Isi nominal pelunasan (biasanya 5-10% terakhir)
- Upload bukti transfer

#### 6.4 Update Status Proyek
```
Detail Proyek → Edit → Status: "Selesai"
```

#### 6.5 Arsip Proyek
Proyek selesai tetap tersimpan di sistem untuk:
- Referensi proyek berikutnya
- Bukti portfolio
- Audit keuangan

---

### 📈 RINGKASAN FLOW KERJA

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLOW KERJA PROYEK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PERSIAPAN                                                   │
│     ├── Buat Proyek Baru                                        │
│     ├── Input RAB                                               │
│     └── Atur Jadwal                                             │
│                                                                 │
│  2. PENERIMAAN DANA                                             │
│     ├── Terima DP                                               │
│     └── Terima Termin (bertahap)                                │
│                                                                 │
│  3. EKSEKUSI LAPANGAN                                           │
│     ├── Daftarkan Tim                                           │
│     ├── Absensi Harian                                          │
│     ├── Kelola Material                                         │
│     ├── Catat Pengeluaran                                       │
│     └── Dokumentasi Foto                                        │
│                                                                 │
│  4. MONITORING                                                  │
│     ├── Update Progress RAB                                     │
│     ├── Pantau Kurva S                                          │
│     ├── Cek Cash Flow                                           │
│     └── Quality Control                                         │
│                                                                 │
│  5. TAGIHAN                                                     │
│     ├── Buat Invoice                                            │
│     ├── Minta Client Approval (NEW)                             │
│     └── Share Portal Klien                                      │
│                                                                 │
│  6. PENYELESAIAN                                                │
│     ├── Verifikasi 100%                                         │
│     ├── Tutup Defect List                                       │
│     ├── Terima Pelunasan                                        │
│     └── Arsip Proyek                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Daftar Isi

1. [Login & Autentikasi](#1-login--autentikasi)
2. [Dashboard Proyek](#2-dashboard-proyek)
3. [Detail Proyek](#3-detail-proyek)
4. [Manajemen RAB & Kurva S](#4-manajemen-rab--kurva-s)
5. [Keuangan (Pemasukan & Pengeluaran)](#5-keuangan-pemasukan--pengeluaran)
6. [Manajemen Tukang & Absensi](#6-manajemen-tukang--absensi)
7. [Logistik & Stok Material](#7-logistik--stok-material)
8. [Galeri Proyek](#8-galeri-proyek)
9. [Library AHS (Analisa Harga Satuan)](#9-library-ahs-analisa-harga-satuan)
10. [Portal Klien](#10-portal-klien)
11. [Manajemen User](#11-manajemen-user)
12. [Landing Page CMS](#12-landing-page-cms)
13. [Tong Sampah](#13-tong-sampah)
14. [Landing Page (Public)](#14-landing-page-public)
15. [Manajemen Subkontraktor](#15-manajemen-subkontraktor)
16. [Resource Calendar](#16-resource-calendar)
17. [Client Approval](#17-client-approval)
18. [Video Walkthrough](#18-video-walkthrough)

---

## 1. Login & Autentikasi

*Screenshot: Halaman login Google*

### Cara Login:
1. Buka aplikasi di browser
2. Klik tombol **"Login dengan Google"**
3. Pilih akun Google yang sudah terdaftar di sistem

### Catatan Penting:
- Hanya user yang sudah didaftarkan oleh Super Admin yang bisa login
- User pertama yang login akan otomatis menjadi Super Admin
- Jika belum terdaftar, akan muncul pesan error

---

## 2. Dashboard Proyek

![Dashboard](docs/screenshots/02_dashboard.png)

Halaman utama adalah pusat kendali bisnis Anda.

### Fitur Utama:
- **Daftar Proyek**: Kartu ringkasan untuk setiap proyek aktif
- **Status Progress**: Bar hijau menunjukkan realisasi fisik di lapangan
- **Indikator Keuangan**: Bar yang membandingkan budget vs pengeluaran aktual (Merah = Overbudget)
- **Cuaca Live**: Ikon cuaca di kartu proyek membantu memutuskan jadwal pekerjaan outdoor

### Aksi Tersedia:
- ➕ **Proyek Baru**: Tombol di pojok kanan atas untuk membuat proyek baru
- 👁️ **Lihat Detail**: Klik kartu proyek untuk masuk ke manajemen lengkap
- 🔗 **Portal Klien**: Bagikan link ke owner untuk monitoring

---

## 3. Detail Proyek

![Detail Proyek](docs/screenshots/03_detail_proyek.png)

Setelah klik proyek, Anda masuk ke halaman detail dengan beberapa tab:

### Tab yang Tersedia:
| Tab | Fungsi |
|-----|--------|
| **Overview** | Ringkasan proyek, statistik, dan alur navigasi cepat |
| **RAB** | Rencana Anggaran Biaya & Kurva S |
| **Keuangan** | Pemasukan, Pengeluaran, Cashflow |
| **Tukang** | Daftar pekerja, absensi, payroll |
| **Logistik** | Stok material & order |
| **Galeri** | Foto-foto progress proyek |

---

## 4. Manajemen RAB & Kurva S

![RAB](docs/screenshots/04_rab.png)

### Cara Membuat RAB:

#### A. Tambah Item Manual
1. Klik tombol **+ Item**
2. Pilih kategori (misal: Pekerjaan Dinding)
3. Isi nama pekerjaan, satuan, volume, dan harga satuan
4. Klik **Simpan**

#### B. Import dari Excel
1. Klik tombol **Import**
2. Download template terlebih dahulu
3. Isi data di Excel sesuai format
4. Upload file

#### C. Generate dengan AI
1. Klik tombol **Auto RAB (AI)**
2. Ketik deskripsi proyek (contoh: *"Rumah Type 36, 2 Kamar Tidur"*)
3. AI akan menyusun item pekerjaan standar

### Kurva S Otomatis:
- Grafik Rencana vs Realisasi diupdate otomatis
- Update progress per item dengan klik tombol **Update Progress**
- Progress tercermin di Kurva S tanpa rumus Excel

### Atur Jadwal Pekerjaan:
1. Klik ikon kalender di tiap item RAB
2. Set tanggal mulai dan selesai
3. Jadwal akan tampil di timeline

---

## 5. Keuangan (Pemasukan & Pengeluaran)

![Keuangan](docs/screenshots/05_keuangan.png)
![Invoice](docs/screenshots/18_invoice_feature.png)

### A. Catat Pemasukan (Dana Masuk)
1. Klik tombol **+ Pemasukan**
2. Pilih kategori: Termin, DP, Pelunasan, atau Tambahan
3. Isi nominal dan tanggal
4. **(Opsional)** Upload bukti transfer/mutasi bank
5. Klik **Simpan Pemasukan**

![Modal Pemasukan](docs/screenshots/05a_modal_pemasukan.png)

### B. Catat Pengeluaran (Dana Keluar)
1. Klik tombol **+ Pengeluaran**
2. Pilih kategori: Material, Upah Tukang, Operasional, Sewa Alat, Lainnya
3. Isi nominal, tanggal, dan keterangan
4. **(Opsional)** Upload foto struk/nota sebagai bukti
5. Klik **Simpan Pengeluaran**

![Modal Pengeluaran](docs/screenshots/05b_modal_pengeluaran.png)

### Upload Bukti Transaksi:
- Foto bukti di-upload ke Google Drive (via Apps Script)
- Preview foto muncul sebelum menyimpan
- Bisa hapus foto jika salah pilih dengan klik tombol X
- Bukti bisa dilihat di detail transaksi nanti

### Invoice Generator:
- Buat tagihan termin untuk klien
- Format PDF profesional dengan kop **PT Guna Karya**
- Otomatis hitung berdasarkan progress RAB

---

## 6. Manajemen Tukang & Absensi

![Tukang](docs/screenshots/06_tukang.png)

### A. Tambah Pekerja
1. Klik **+ Tukang Baru**
2. Isi nama, role (Tukang/Kuli/Mandor/Kepala Tukang)
3. Isi upah asli (rate internal) dan upah mandor (rate charge ke klien)
4. Pilih sistem upah: Harian, Mingguan, Bulanan, atau Borongan

### B. Absensi Harian
1. Klik tombol **Absensi Hari Ini**
2. Pilih tanggal
3. Set status tiap pekerja: Hadir (1), Setengah (0.5), Lembur (1.5), Absen (0)
4. **WAJIB**: Upload foto bukti lapangan (kamera otomatis terdeteksi)
5. **WAJIB**: Lokasi GPS otomatis tercatat
6. Klik **Simpan Absensi**

### C. Fitur Anti-Manipulasi:
- Foto bukti wajib diupload
- Lokasi GPS wajib terdeteksi
- Lokasi bisa diklik untuk buka Google Maps
- Timestamp tercatat otomatis

### D. Payroll Summary:
- Lihat rekap gaji per periode
- Hitung otomatis berdasarkan jumlah hadir x rate
- Export ke PDF

---

## 7. Logistik & Stok Material

![Logistik](docs/screenshots/07_logistik.png)

### A. Stok Lapangan
1. Klik **+ Material Baru** untuk tambah item
2. Isi nama material, satuan, stok minimum
3. Update stok dengan tombol **Update Stok** (Barang Masuk / Keluar)

### B. Peringatan Stok:
- Kartu berwarna **MERAH** jika stok di bawah minimum
- Notifikasi "STOK MENIPIS" muncul otomatis

### C. Order via WhatsApp:
1. Klik **Order via WhatsApp** pada material yang menipis
2. Masukkan nama & nomor toko supplier
3. Draft pesanan otomatis dibuat
4. Kirim langsung ke WhatsApp

### D. Rekap Kebutuhan Proyek (Smart Shopping):
1. Klik **Rekap Kebutuhan Proyek**
2. Sistem menghitung total kebutuhan bahan dari RAB + AHS
3. Hasil: daftar belanja lengkap
4. Cetak/Export ke PDF

---

## 8. Galeri Proyek

![Galeri](docs/screenshots/08_galeri.png)

### Upload Foto Progress:
1. Klik **+ Tambah Foto**
2. Pilih foto dari kamera/galeri
3. Foto di-upload ke Google Drive
4. Progress saat foto diambil tercatat otomatis

### Fitur Galeri:
- Filter berdasarkan tanggal
- Tampilkan progress (%) saat foto diambil
- Bisa dilihat oleh klien via Portal Klien

---

## 9. Library AHS (Analisa Harga Satuan)

![Library AHS](docs/screenshots/09_library_ahs.png)

### Apa itu AHS?
Analisa Harga Satuan adalah breakdown komponen (bahan + upah) untuk setiap jenis pekerjaan.

### Cara Kelola AHS:
1. Masuk ke menu **Library AHS** dari sidebar
2. **Tambah AHS Baru**: Klik + dan isi komponen
3. **Edit Harga Dasar**: Edit harga bahan/upah di tab Resources

### AI Assistant:
Ketik perintah natural di kolom AI:
- *"Naikkan harga semen jadi 65.000"*
- *"Hapus item batu kali"*
- *"Tambah upah tukang gali 120.000"*

### Smart Sync:
Jika harga dasar berubah, klik **Sync Semua AHS** untuk update semua item RAB di semua proyek.

---

## 10. Portal Klien

![Portal Klien](docs/screenshots/10_portal_klien.png)

Fitur transparansi untuk pemilik proyek.

### Cara Berbagi:
1. Di dashboard, klik tombol **Portal Klien** pada proyek
2. Link unik akan disalin
3. Kirim link via WhatsApp ke pemilik

### Yang Bisa Dilihat Klien:
- ✅ Progress fisik
- ✅ Galeri foto progress
- ✅ Kurva S sederhana
- ❌ Nilai uang/profit kontraktor (DISEMBUNYIKAN)

---

## 11. Manajemen User

![User Management](docs/screenshots/11_user_management.png)

*Khusus Super Admin*

### Role yang Tersedia:
| Role | Akses |
|------|-------|
| **Super Admin** | Akses penuh, bisa kelola user |
| **Kontraktor** | Project Manager, lihat keuangan |
| **Pengawas** | Absensi & data tukang saja |
| **Keuangan** | Hanya data keuangan |

### Cara Tambah User:
1. Buka menu **User Management**
2. Klik **+ Tambah User**
3. Masukkan email Google dan pilih role
4. User akan bisa login setelah didaftarkan

---

## 12. Landing Page CMS

![Landing CMS](docs/screenshots/12_landing_cms.png)

*Khusus Admin*

### Yang Bisa Diubah:
- **Nama Perusahaan**: PT/CV yang tampil di kop surat
- **Tagline**: Slogan perusahaan
- **Kontak**: WhatsApp, Instagram
- **Portfolio**: Foto proyek terbaik untuk halaman depan

---

## 13. Tong Sampah

![Tong Sampah](docs/screenshots/13_tong_sampah.png)

Fitur untuk mengelola proyek yang dihapus.

### Cara Kerja:
- Proyek yang dihapus tidak langsung hilang, tapi masuk ke **Tong Sampah**
- Dari sini bisa dipilih untuk:
  - **Pulihkan**: Kembalikan proyek ke dashboard
  - **Hapus Permanen**: Hapus proyek selamanya

### Akses:
- Klik menu **Tong Sampah** di sidebar
- Hanya Super Admin dan Kontraktor yang bisa mengakses

---

## 14. Landing Page (Public)

![Landing Page](docs/screenshots/14_landing_page.png)

Halaman depan website yang dilihat publik/calon klien.

### Fitur:
- **Hero Section**: Tagline dan CTA button
- **Statistik**: Jumlah proyek, tahun pengalaman
- **Tombol Konsultasi**: Link langsung ke WhatsApp
- **Lihat Portfolio**: Gallery proyek selesai

### Cara Edit:
- Konten dikelola melalui **Landing Page CMS** (Section 12)

---

## 15. Manajemen Subkontraktor

![Subkon](docs/screenshots/15_subkon_pekerja.png)

Kelola pekerjaan yang diserahkan ke pihak ketiga (borongan/subkon).

### Fitur:
- **Daftar Subkon**: Catat nama, kontak, dan nilai kontrak subkon
- **Progress Tracking**: Monitor progress % pekerjaan subkon
- **Pembayaran Bertahap**: Catat pembayaran termin ke subkon
- **Link ke RAB**: Hubungkan subkon dengan item pekerjaan spesifik

### Cara Menggunakan:
1. Buka tab **"Tim & Absensi"** -> Sub-tab **"Subkon"** (jika ada) atau di **Resource Calendar**
2. Klik **"+ Tambah Subkon"**
3. Isi detail kontrak dan item pekerjaannya
4. Update progress dan pembayaran sesuai realisasi

---

## 16. Resource Calendar (Kalender Proyek)

![Calendar](docs/screenshots/16_resource_calendar.png)

Tampilan visual jadwal seluruh sumber daya proyek.

### Fitur:
- **Unified View**: Gabungan jadwal Worker, Equipment, dan Subkon dalam satu kalender
- **Interaktif**: Klik tanggal untuk melihat detail resource yang aktif hari itu
- **Legend Warna**:
  - 🔵 Worker (Tukang)
  - 🟠 Equipment (Alat)
  - 🟣 Subkon

### Cara Menggunakan:
1. Masuk ke tab **"Tim & Absensi"** -> Klik **"📅 Kalender"**
2. Lihat sebaran jadwal dalam bulan ini
3. **Klik tanggal** di kotak kalender untuk melihat detail di bagian bawah ("Resource Hari Ini")

---

## 17. Client Approval

![Approval](docs/screenshots/17_client_approval.png)

Fitur kolaborasi dengan klien untuk persetujuan dokumen dan progress.

### Fungsi:
- **Transparansi**: Klien bisa melihat item yang butuh persetujuan
- **Invoice Approval**: Klien bisa menyetujui tagihan sebelum pembayaran
- **Progress Approval**: Klien memvalidasi klaim progress lapangan

### Cara Kerja:
- **Kontraktor**: Item muncul otomatis saat Invoice dibuat atau Progress diupdate
- **Klien**: Masuk via Portal Klien -> Lihat bagian **"Approval Klien"**
- **Aksi**: Klien klik **"Setuju"** atau **"Tolak"** (dengan alasan)
- Status otomatis terupdate di sistem kontraktor (misal: Invoice jadi "Approved")

---

## 18. Video Walkthrough

![Video Walkthrough](docs/videos/overview_walkthrough.webp)

Video singkat penggunaan fitur-fitur di atas.

---

## 📸 Daftar Screenshot Tersedia

Screenshot dokumentasi tersimpan di folder `docs/screenshots/`:

| No | Nama File | Halaman/Fitur |
|----|-----------|---------------|
| 02 | `02_dashboard.png` | Dashboard utama dengan daftar proyek |
| 04 | `04_rab_timeline.png` | Timeline Pekerjaan (Kurva S & RAB) |
| 05 | `05_keuangan.png` | Tab Keuangan dengan Cash Flow |
| 06 | `06_tukang.png` | Tim & Absensi, Daftar Pekerja |
| 07 | `07_logistik.png` | Tab Logistik/Stok Material |
| 08 | `08_galeri.png` | Tab Galeri Proyek |
| 09 | `09_library_ahs.png` | Library & Standar Harga |
| 10 | `10_portal_klien.png` | Portal Klien (View Owner) |
| 11 | `11_user_management.png` | Kelola Akses Pengguna |
| 12 | `12_landing_cms.png` | Kelola Landing Page |
| 13 | `13_tong_sampah.png` | Tong Sampah Proyek |
| 14 | `14_landing_page.png` | Landing Page (Public) |
| 15 | `15_subkon_pekerja.png` | Tampilan Subkon di Tab Pekerja |
| 16 | `16_resource_calendar.png` | Kalender Resource Interaktif |
| 17 | `17_client_approval.png` | Halaman Ringkasan & Approval |
| 18 | `18_invoice_feature.png` | Fitur Invoice & Termin Baru |

---

## 🔄 Changelog

### v2.1 (Desember 2024 - Update Akhir Tahun)
- ✅ **New**: Manajemen Subkontraktor (Kontrak & Bayar)
- ✅ **New**: Resource Calendar yang Interaktif
- ✅ **New**: Client Approval Workflow
- ✅ **Update**: Branding "Guna Karya" di seluruh laporan PDF
- 📚 **Dokumentasi**: Video Walkthrough & 16 Screenshot lengkap

### v2.0 (Desember 2024)
- ❌ **Dihapus**: Fitur AI Scan Struk (tidak akurat)
- ✅ **Baru**: Upload bukti transaksi (struk/transfer) ke Google Drive
- ✅ **Perbaikan**: Form transaksi auto-reset setelah simpan
- ✅ **Perbaikan**: Error handling lebih baik di penyimpanan transaksi
- 📚 **Dokumentasi**: Manual lengkap dengan 12 screenshot

### v1.0 (November 2024)
- Rilis awal dengan fitur lengkap

---

*Dibuat oleh Sistem Kontraktor Pro - Guna Karya*
