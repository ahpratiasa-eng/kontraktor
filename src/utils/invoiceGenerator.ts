import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project, PaymentTerm } from '../types';
import { formatRupiah, getStats } from './helpers';

// Extend jsPDF to include autoTable type
interface jsPDFCustom extends jsPDF {
    lastAutoTable: { finalY: number };
}

/**
 * Generate professional invoice PDF for a payment term
 */
export const generateInvoice = (
    project: Project,
    term: PaymentTerm,
    companyName: string = 'KONTRAKTOR PRO',
    companyAddress: string = ''
) => {
    const doc = new jsPDF() as jsPDFCustom;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let yPos = margin;

    // Generate invoice number if not exists
    const invoiceNumber = term.invoiceNumber || `INV-${new Date().getFullYear()}-${String(term.id).padStart(4, '0')}`;
    const invoiceDate = term.invoiceDate || new Date().toISOString().split('T')[0];
    const dueDate = term.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // ================= HEADER =================
    // Company Name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(companyName.toUpperCase(), margin, yPos + 8);

    // Invoice Title
    doc.setFontSize(28);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text("INVOICE", pageWidth - margin, yPos + 8, { align: 'right' });

    yPos += 20;

    // Company Address (if provided)
    if (companyAddress) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(companyAddress, margin, yPos);
        yPos += 8;
    }

    // Line separator
    yPos += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ================= INVOICE INFO =================
    // Left side: Bill To
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("TAGIHAN KEPADA:", margin, yPos);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(project.client, margin, yPos + 7);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(project.location || '-', margin, yPos + 14);

    // Right side: Invoice Details
    const rightCol = pageWidth - margin - 60;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("NO. INVOICE:", rightCol, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(invoiceNumber, rightCol + 35, yPos);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("TANGGAL:", rightCol, yPos + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(new Date(invoiceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), rightCol + 35, yPos + 7);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("JATUH TEMPO:", rightCol, yPos + 14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 38, 38); // red for due date
    doc.text(new Date(dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), rightCol + 35, yPos + 14);

    yPos += 35;

    // ================= PROJECT INFO BOX =================
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, 'S');

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("PROYEK:", margin + 5, yPos + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(project.name, margin + 25, yPos + 8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("PERIODE:", margin + 5, yPos + 16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    const startDate = new Date(project.startDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    const endDate = new Date(project.endDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    doc.text(`${startDate} - ${endDate}`, margin + 28, yPos + 16);

    // Progress on right
    const stats = getStats(project);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text("PROGRESS:", pageWidth - margin - 45, yPos + 12);
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(`${stats.prog.toFixed(1)}%`, pageWidth - margin - 5, yPos + 12, { align: 'right' });

    yPos += 35;

    // ================= INVOICE TABLE =================
    const contractValue = project.contractValue || project.budgetLimit;

    autoTable(doc, {
        startY: yPos,
        head: [['Deskripsi', 'Persentase', 'Jumlah']],
        body: [
            [
                `${term.name}\n(Target Progress: ${term.targetProgress}%)`,
                `${term.percentage}%`,
                formatRupiah(term.amount || (contractValue * term.percentage / 100))
            ]
        ],
        foot: [
            ['', 'Total Tagihan', formatRupiah(term.amount || (contractValue * term.percentage / 100))]
        ],
        theme: 'grid',
        headStyles: {
            fillColor: [51, 65, 85],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 10,
            cellPadding: 8
        },
        footStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 'auto', halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // ================= PAYMENT INFO =================
    doc.setFillColor(254, 249, 195); // yellow-100
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
    doc.setDrawColor(250, 204, 21); // yellow-400
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'S');

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(161, 98, 7); // yellow-700
    doc.text("INFORMASI PEMBAYARAN", margin + 5, yPos + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Transfer ke rekening:", margin + 5, yPos + 16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Bank BCA - 1234567890 a.n. PT Guna Karya", margin + 50, yPos + 16);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Mohon sertakan nomor invoice pada keterangan transfer.", margin + 5, yPos + 24);

    yPos += 50;

    // ================= NOTES =================
    if (term.notes) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text("CATATAN:", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        const splitNotes = doc.splitTextToSize(term.notes, pageWidth - margin * 2);
        doc.text(splitNotes, margin, yPos + 6);
    }

    // ================= FOOTER =================
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Invoice ini dibuat secara otomatis oleh Guna Karya.", pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Save
    // Save
    const safeProjectName = project.name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
    const safeInvoiceNum = invoiceNumber.replace(/[^a-zA-Z0-9\s-_]/g, '-');
    const filename = `Invoice_${safeInvoiceNum}_${safeProjectName}.pdf`;

    try {
        doc.save(filename);
    } catch (err) {
        console.error("PDF Save failed:", err);
        // Fallback or rethrow
        throw new Error("Gagal menyimpan file PDF. Coba gunakan browser lain atau nama proyek yang lebih sederhana.");
    }

    return invoiceNumber;
};
