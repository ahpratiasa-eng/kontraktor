import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '../types';
import { formatRupiah, getStats } from './helpers';

// Extend jsPDF to include autoTable type
interface jsPDFCustom extends jsPDF {
    lastAutoTable: { finalY: number };
}

export const generateDailyReport = (project: Project, dateStr: string, customNote: string = '') => {
    const doc = new jsPDF() as jsPDFCustom;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let finalY = margin;

    // Helper to format date
    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const todayFormatted = formatDate(dateStr);

    // ================= HEADER =================
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN HARIAN PROYEK", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${project.name}`, pageWidth / 2, 26, { align: "center" });

    // Info Box
    finalY = 35;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(margin, finalY, pageWidth - (margin * 2), 25, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(margin, finalY, pageWidth - (margin * 2), 25, 'S');

    doc.setFontSize(9);
    doc.text(`Tanggal: ${todayFormatted}`, margin + 5, finalY + 8);
    doc.text(`Klien: ${project.client}`, margin + 5, finalY + 14);
    doc.text(`Lokasi: ${project.location || '-'}`, margin + 5, finalY + 20);

    // Status Badge Simulation
    const stats = getStats(project);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(`Progress: ${stats.prog.toFixed(1)}%`, pageWidth - margin - 5, finalY + 8, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset color
    doc.setFont("helvetica", "normal");

    finalY += 35;

    // ================= 1. RINGKASAN PEKERJA (ABSENSI) =================
    const dailyLogs = (project.attendanceLogs || []).filter(l => l.date === dateStr);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Tenaga Kerja", margin, finalY);
    finalY += 2;

    if (dailyLogs.length > 0) {
        const workerData = dailyLogs.map(log => {
            const worker = project.workers.find(w => w.id === log.workerId);
            return [
                worker?.name || 'Unknown',
                worker?.role || '-',
                log.status.toUpperCase()
            ];
        });

        autoTable(doc, {
            startY: finalY + 2,
            head: [['Nama', 'Posisi', 'Status Kehadiran']],
            body: workerData,
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85] }, // Slate-700
            styles: { fontSize: 9, cellPadding: 2 },
            margin: { left: margin, right: margin }
        });

        finalY = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Tidak ada data pekerja hari ini.", margin, finalY + 6);
        doc.setTextColor(0);
        finalY += 15;
    }

    // ================= 2. CATATAN / PROGRESS =================
    // ================= 2. CATATAN / PROGRESS =================
    // Find TaskLogs for today
    const dailyTaskLogs = (project.taskLogs || []).filter(t => t.date === dateStr);

    // Combine custom note with task logs
    let notesContent = customNote;
    if (dailyTaskLogs.length > 0) {
        const taskNotes = dailyTaskLogs.map(t => {
            const task = project.tasks.find(tk => tk.id === t.taskId);
            return `- [${task?.name || 'Task'}]: ${t.note} (${t.newProgress}%)`;
        }).join('\n');

        if (notesContent) notesContent += '\n\n';
        notesContent += 'Update Pekerjaan:\n' + taskNotes;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("2. Catatan Pekerjaan", margin, finalY);

    if (notesContent) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const splitNotes = doc.splitTextToSize(notesContent, pageWidth - (margin * 2));
        doc.text(splitNotes, margin, finalY + 6);
        finalY += (splitNotes.length * 5) + 10;
    } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Tidak ada catatan progress hari ini (belum ada input).", margin, finalY + 6);
        doc.setTextColor(0);
        finalY += 15;
    }

    // ================= 3. PENGELUARAN / MATERIAL =================
    const dailyTransactions = (project.transactions || []).filter(t => t.date === dateStr && t.type === 'expense');

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("3. Material & Pengeluaran", margin, finalY);
    finalY += 2;

    if (dailyTransactions.length > 0) {
        const txData = dailyTransactions.map(t => [
            t.description,
            t.category,
            formatRupiah(t.amount)
        ]);

        const totalDailyExpense = dailyTransactions.reduce((acc, curr) => acc + curr.amount, 0);
        // Add Total Row
        txData.push(['TOTAL', '', formatRupiah(totalDailyExpense)]);

        autoTable(doc, {
            startY: finalY + 2,
            head: [['Keterangan', 'Kategori', 'Nominal']],
            body: txData,
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38] }, // Red-600
            footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 2 },
            margin: { left: margin, right: margin }
        });

        finalY = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Tidak ada pengeluaran hari ini.", margin, finalY + 6);
        doc.setTextColor(0);
        finalY += 15;
    }

    // ================= 4. DOKUMENTASI =================
    const dailyPhotos = (project.gallery || []).filter(p => p.date === dateStr);

    // Only add new page if not enough space
    if (finalY > 200) {
        doc.addPage();
        finalY = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("4. Dokumentasi", margin, finalY);
    finalY += 8;

    if (dailyPhotos.length > 0) {

        // This is tricky simply because loading images to PDF requires Base64 or accessible URLs.
        // Assuming we have public URLs or Base64. If URLs are from Google Drive or Firebase that need auth or have CORS, this might fail in Client-side PDF generation without a proxy.
        // For now, we will list the photos textually if we can't display them, or Try to add clickable links.

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        dailyPhotos.forEach((photo, index) => {
            // Simple list for now as rendering remote images in JS PDF is complex (CORS issues commonly)
            // Unless we fetch them as blobs first.
            doc.setTextColor(37, 99, 235); // Blue link
            const caption = photo.caption ? ` - ${photo.caption}` : '';
            doc.text(`[Foto ${index + 1}]${caption} - Lihat Foto`, margin, finalY);
            doc.link(margin, finalY - 3, 50, 5, { url: photo.url });
            finalY += 6;
        });

        doc.setTextColor(0);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("* Klik link di atas untuk melihat foto full resolusi.", margin, finalY + 5);

    } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Tidak ada dokumentasi foto hari ini.", margin, finalY);
        doc.setTextColor(0);
    }

    // ================= FOOTER =================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated by Guna Karya - ${new Date().toLocaleString('id-ID')}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    // Save
    doc.save(`Laporan_Harian_Proyek_${project.name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
};
