import jsPDF from 'jspdf';
import type { Project } from '../types';

export interface SPKData {
    // Pihak Pertama (Pemberi Kerja)
    pihakPertamaNama: string;
    pihakPertamaJabatan: string;
    pihakPertamaAlamat: string;
    pihakPertamaNIK?: string;

    // Pihak Kedua (Pelaksana/Kontraktor)
    pihakKeduaNama: string;
    pihakKeduaPerusahaan: string;
    pihakKeduaJabatan: string;
    pihakKeduaAlamat: string;
    pihakKeduaNPWP?: string;

    // Detail Pekerjaan
    nomorSPK: string;
    tanggalSPK: string;
    nilaiKontrak: number;
    terbilang: string;
    jangkaWaktu: number; // dalam hari

    // Payment Terms
    dpPercent: number;
    termin1Percent: number;
    termin2Percent: number;
    pelunasanPercent: number;

    // Lainnya
    dendaPerHari: number;
    lokasiTTD: string;
}

// Convert number to Indonesian words
export const angkaTerbilang = (angka: number): string => {
    const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

    if (angka < 12) return satuan[angka];
    if (angka < 20) return satuan[angka - 10] + ' belas';
    if (angka < 100) return satuan[Math.floor(angka / 10)] + ' puluh ' + satuan[angka % 10];
    if (angka < 200) return 'seratus ' + angkaTerbilang(angka - 100);
    if (angka < 1000) return satuan[Math.floor(angka / 100)] + ' ratus ' + angkaTerbilang(angka % 100);
    if (angka < 2000) return 'seribu ' + angkaTerbilang(angka - 1000);
    if (angka < 1000000) return angkaTerbilang(Math.floor(angka / 1000)) + ' ribu ' + angkaTerbilang(angka % 1000);
    if (angka < 1000000000) return angkaTerbilang(Math.floor(angka / 1000000)) + ' juta ' + angkaTerbilang(angka % 1000000);
    if (angka < 1000000000000) return angkaTerbilang(Math.floor(angka / 1000000000)) + ' miliar ' + angkaTerbilang(angka % 1000000000);
    return angkaTerbilang(Math.floor(angka / 1000000000000)) + ' triliun ' + angkaTerbilang(angka % 1000000000000);
};

export const generateSPKPDF = (project: Project, data: SPKData): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, x: number, yPos: number, options?: any) => {
        doc.text(text, x, yPos, options);
    };

    const addJustifiedParagraph = (text: string, yStart: number, lineHeight: number = 6): number => {
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
            addText(line, margin, yStart);
            yStart += lineHeight;
        });
        return yStart;
    };

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    addText("SURAT PERJANJIAN KERJA (SPK)", pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    addText(`Nomor: ${data.nomorSPK}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Pembukaan
    doc.setFontSize(10);
    const pembukaan = `Pada hari ini, ${new Date(data.tanggalSPK).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, kami yang bertanda tangan di bawah ini:`;
    y = addJustifiedParagraph(pembukaan, y);
    y += 5;

    // Pihak Pertama
    doc.setFont("helvetica", "bold");
    addText("PIHAK PERTAMA:", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    addText(`Nama          : ${data.pihakPertamaNama}`, margin + 5, y);
    y += 5;
    addText(`Jabatan       : ${data.pihakPertamaJabatan}`, margin + 5, y);
    y += 5;
    addText(`Alamat        : ${data.pihakPertamaAlamat}`, margin + 5, y);
    if (data.pihakPertamaNIK) {
        y += 5;
        addText(`NIK           : ${data.pihakPertamaNIK}`, margin + 5, y);
    }
    y += 5;
    addText("Selanjutnya disebut sebagai PEMBERI KERJA", margin + 5, y);
    y += 10;

    // Pihak Kedua
    doc.setFont("helvetica", "bold");
    addText("PIHAK KEDUA:", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    addText(`Nama          : ${data.pihakKeduaNama}`, margin + 5, y);
    y += 5;
    addText(`Perusahaan    : ${data.pihakKeduaPerusahaan}`, margin + 5, y);
    y += 5;
    addText(`Jabatan       : ${data.pihakKeduaJabatan}`, margin + 5, y);
    y += 5;
    addText(`Alamat        : ${data.pihakKeduaAlamat}`, margin + 5, y);
    if (data.pihakKeduaNPWP) {
        y += 5;
        addText(`NPWP          : ${data.pihakKeduaNPWP}`, margin + 5, y);
    }
    y += 5;
    addText("Selanjutnya disebut sebagai PELAKSANA", margin + 5, y);
    y += 10;

    // Pernyataan Kesepakatan
    const kesepakatan = "Kedua belah pihak sepakat untuk mengikatkan diri dalam Perjanjian Kerja dengan ketentuan sebagai berikut:";
    y = addJustifiedParagraph(kesepakatan, y);
    y += 8;

    // Pasal 1 - Lingkup Pekerjaan
    doc.setFont("helvetica", "bold");
    addText("PASAL 1 - LINGKUP PEKERJAAN", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    y = addJustifiedParagraph(`PIHAK PERTAMA memberikan pekerjaan kepada PIHAK KEDUA untuk melaksanakan pekerjaan "${project.name}" yang berlokasi di ${project.location}.`, y);
    y += 8;

    // Pasal 2 - Nilai Kontrak  
    doc.setFont("helvetica", "bold");
    addText("PASAL 2 - NILAI KONTRAK", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    y = addJustifiedParagraph(`Nilai kontrak pekerjaan ini adalah sebesar Rp ${data.nilaiKontrak.toLocaleString('id-ID')} (${data.terbilang} rupiah).`, y);
    y += 8;

    // Pasal 3 - Jangka Waktu
    doc.setFont("helvetica", "bold");
    addText("PASAL 3 - JANGKA WAKTU PELAKSANAAN", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    y = addJustifiedParagraph(`Jangka waktu pelaksanaan pekerjaan adalah ${data.jangkaWaktu} (${angkaTerbilang(data.jangkaWaktu)}) hari kalender, terhitung sejak ${new Date(project.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} sampai dengan ${new Date(project.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`, y);
    y += 8;

    // Check if need new page
    if (y > 250) {
        doc.addPage();
        y = 20;
    }

    // Pasal 4 - Pembayaran
    doc.setFont("helvetica", "bold");
    addText("PASAL 4 - CARA PEMBAYARAN", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    addText("Pembayaran dilakukan dengan sistem termin sebagai berikut:", margin, y);
    y += 6;
    if (data.dpPercent > 0) {
        addText(`a. Down Payment (DP)  : ${data.dpPercent}% = Rp ${(data.nilaiKontrak * data.dpPercent / 100).toLocaleString('id-ID')}`, margin + 5, y);
        y += 5;
    }
    if (data.termin1Percent > 0) {
        addText(`b. Termin 1 (50%)     : ${data.termin1Percent}% = Rp ${(data.nilaiKontrak * data.termin1Percent / 100).toLocaleString('id-ID')}`, margin + 5, y);
        y += 5;
    }
    if (data.termin2Percent > 0) {
        addText(`c. Termin 2 (80%)     : ${data.termin2Percent}% = Rp ${(data.nilaiKontrak * data.termin2Percent / 100).toLocaleString('id-ID')}`, margin + 5, y);
        y += 5;
    }
    if (data.pelunasanPercent > 0) {
        addText(`d. Pelunasan (100%)   : ${data.pelunasanPercent}% = Rp ${(data.nilaiKontrak * data.pelunasanPercent / 100).toLocaleString('id-ID')}`, margin + 5, y);
        y += 5;
    }
    y += 8;

    // Pasal 5 - Denda
    doc.setFont("helvetica", "bold");
    addText("PASAL 5 - DENDA KETERLAMBATAN", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    y = addJustifiedParagraph(`Apabila PIHAK KEDUA terlambat menyelesaikan pekerjaan, maka PIHAK KEDUA dikenakan denda sebesar Rp ${data.dendaPerHari.toLocaleString('id-ID')} per hari keterlambatan, maksimal 5% dari nilai kontrak.`, y);
    y += 8;

    // Pasal 6 - Penutup
    doc.setFont("helvetica", "bold");
    addText("PASAL 6 - PENUTUP", margin, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    y = addJustifiedParagraph("Demikian Surat Perjanjian Kerja ini dibuat dalam rangkap 2 (dua), masing-masing bermaterai cukup dan mempunyai kekuatan hukum yang sama.", y);
    y += 15;

    // Check if need new page for signatures
    if (y > 230) {
        doc.addPage();
        y = 20;
    }

    // Tanda Tangan
    addText(`${data.lokasiTTD}, ${new Date(data.tanggalSPK).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Signature boxes
    const sigWidth = (contentWidth - 20) / 2;

    doc.setFont("helvetica", "bold");
    addText("PIHAK PERTAMA", margin + sigWidth / 2, y, { align: 'center' });
    addText("PIHAK KEDUA", margin + sigWidth + 20 + sigWidth / 2, y, { align: 'center' });

    y += 30; // Space for signature

    doc.setFont("helvetica", "normal");
    addText(`(${data.pihakPertamaNama})`, margin + sigWidth / 2, y, { align: 'center' });
    addText(`(${data.pihakKeduaNama})`, margin + sigWidth + 20 + sigWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(8);
    addText(data.pihakPertamaJabatan || "Pemberi Kerja", margin + sigWidth / 2, y, { align: 'center' });
    addText(data.pihakKeduaJabatan || "Pelaksana", margin + sigWidth + 20 + sigWidth / 2, y, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Dokumen ini dibuat secara otomatis oleh Guna Karya - ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

    doc.save(`SPK_${project.name.replace(/\s+/g, '_')}_${data.nomorSPK.replace(/\//g, '-')}.pdf`);
};

// Default SPK data template
export const getDefaultSPKData = (project: Project): SPKData => {
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        pihakPertamaNama: project.client,
        pihakPertamaJabatan: "Pemilik Proyek",
        pihakPertamaAlamat: project.location,

        pihakKeduaNama: "",
        pihakKeduaPerusahaan: "PT Guna Karya",
        pihakKeduaJabatan: "Direktur",
        pihakKeduaAlamat: "",

        nomorSPK: `SPK/${project.id.slice(0, 6).toUpperCase()}/${new Date().getFullYear()}`,
        tanggalSPK: new Date().toISOString().split('T')[0],
        nilaiKontrak: project.contractValue || project.budgetLimit || 0,
        terbilang: angkaTerbilang(project.contractValue || project.budgetLimit || 0).trim(),
        jangkaWaktu: diffDays,

        dpPercent: 30,
        termin1Percent: 30,
        termin2Percent: 20,
        pelunasanPercent: 20,

        dendaPerHari: Math.round((project.contractValue || project.budgetLimit || 0) * 0.001),
        lokasiTTD: project.location.split(',')[0] || "Jakarta"
    };
};
