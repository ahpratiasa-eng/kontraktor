import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import type {
    Project, RABItem, Transaction, Worker, Material, MaterialLog, TaskLog, AHSItem
} from '../types';
import { calculateAHSTotal } from '../types';
import { calculateProjectHealth, formatRupiah } from '../utils/helpers';
import { compressImage } from '../utils/imageHelper';

interface UseProjectHandlersProps {
    user: any;
    activeProject: Project | null;
    updateProject: (data: Partial<Project>) => Promise<void>;
    setActiveProjectId: (id: string | null) => void;
    setShowModal: (show: boolean) => void;
    setModalType: (type: string) => void;
    ahsItems: AHSItem[];
    // Form states
    inputName: string;
    inputClient: string;
    inputLocation: string;
    inputOwnerPhone: string;
    inputBudget: number;
    inputStartDate: string;
    inputEndDate: string;
    inputHeroImage: string;
    rabCategory: string;
    rabItemName: string;
    rabUnit: string;
    rabVol: number;
    rabPrice: number;
    selectedRabItem: RABItem | null;
    selectedAhsId: string | null;
    progressInput: number;
    progressDate: string;
    progressNote: string;
    paymentAmount: number;
    selectedWorkerId: number | null;
    inputWorkerRole: string;
    inputWageUnit: string;
    inputRealRate: number;
    inputMandorRate: number;
    stockType: 'in' | 'out';
    stockQty: number;
    stockDate: string;
    stockNotes: string;
    selectedMaterial: Material | null;
    inputMaterialName: string;
    inputMaterialUnit: string;
    inputMinStock: number;
    inputInitialStock: number;
    attendanceDate: string;
    attendanceData: { [key: number]: { status: string } };
    evidencePhoto: string | null;
    evidenceLocation: string | null;
    aiPrompt: string;
    // Setters
    setInputName: (v: string) => void;
    setInputClient: (v: string) => void;
    setInputLocation: (v: string) => void;
    setInputOwnerPhone: (v: string) => void;
    setInputBudget: (v: number) => void;

    // Transaction Props
    transactionDesc: string;
    transactionAmount: number;
    transactionDate: string;
    setTransactionDesc: (v: string) => void;
    setTransactionAmount: (v: number) => void;
    setTransactionDate: (v: string) => void;

    setInputStartDate: (v: string) => void;
    setInputEndDate: (v: string) => void;
    setInputHeroImage: (v: string) => void;
    setRabCategory: (v: string) => void;
    setRabItemName: (v: string) => void;
    setRabUnit: (v: string) => void;
    setRabVol: (v: number) => void;
    setRabPrice: (v: number) => void;
    setSelectedRabItem: (v: RABItem | null) => void;
    setSelectedAhsId: (v: string | null) => void;
    setProgressInput: (v: number) => void;
    setProgressDate: (v: string) => void;
    setSelectedWorkerId: (v: number | null) => void;
    setPaymentAmount: (v: number) => void;
    setInputWorkerRole: (v: string) => void;
    setInputWageUnit: (v: string) => void;
    setInputRealRate: (v: number) => void;
    setInputMandorRate: (v: number) => void;
    setStockQty: (v: number) => void;
    setStockNotes: (v: string) => void;
    setEvidencePhoto: (v: string | null) => void;
    setEvidenceLocation: (v: string | null) => void;
    setIsGettingLoc: (v: boolean) => void;
    setIsGeneratingAI: (v: boolean) => void;
    setSelectedMaterial: (v: Material | null) => void;
    setInputMaterialName: (v: string) => void;
    setInputMaterialUnit: (v: string) => void;
    setInputMinStock: (v: number) => void;
    setInputInitialStock: (v: number) => void;
}

export const useProjectHandlers = (props: UseProjectHandlersProps) => {
    const {
        user, activeProject, updateProject, setShowModal, setModalType, ahsItems,
        inputName, inputClient, inputLocation, inputOwnerPhone, inputBudget, inputStartDate, inputEndDate, inputHeroImage,
        rabCategory, rabItemName, rabUnit, rabVol, rabPrice, selectedRabItem, selectedAhsId,
        progressInput, progressDate, progressNote, paymentAmount, selectedWorkerId,
        inputWorkerRole, inputWageUnit, inputRealRate, inputMandorRate,
        stockType, stockQty, stockDate, stockNotes, selectedMaterial,
        inputMaterialName, inputMaterialUnit, inputMinStock, inputInitialStock,
        attendanceDate, attendanceData, evidencePhoto, evidenceLocation, aiPrompt,
        setInputName, setInputClient, setInputLocation, setInputOwnerPhone, setInputBudget, setInputStartDate, setInputEndDate, setInputHeroImage,
        setRabCategory, setRabItemName, setRabUnit, setRabVol, setRabPrice, setSelectedRabItem, setSelectedAhsId,
        setSelectedWorkerId,
        setInputWorkerRole, setInputWageUnit, setInputRealRate, setInputMandorRate,
        setStockQty, setStockNotes, setEvidencePhoto, setEvidenceLocation, setIsGettingLoc, setIsGeneratingAI, setActiveProjectId,
        setSelectedMaterial, setInputMaterialName, setInputMaterialUnit, setInputMinStock, setInputInitialStock
    } = props;

    // ========== RAB Handlers ==========
    const handleSaveRAB = () => {
        if (!activeProject) return;
        const isNewItem = !selectedRabItem;
        const newItem: RABItem = {
            id: selectedRabItem ? selectedRabItem.id : Date.now(),
            category: rabCategory,
            name: rabItemName,
            unit: rabUnit,
            volume: rabVol,
            unitPrice: rabPrice,
            progress: selectedRabItem?.progress || 0,
            isAddendum: selectedRabItem?.isAddendum || false,
            priceLockedAt: isNewItem ? new Date().toISOString() : (selectedRabItem?.priceLockedAt || new Date().toISOString()),
            ahsItemId: isNewItem ? (selectedAhsId || undefined) : (selectedRabItem?.ahsItemId || selectedAhsId || undefined)
        };
        const newItems = selectedRabItem
            ? activeProject.rabItems.map((i: RABItem) => i.id === newItem.id ? newItem : i)
            : [...activeProject.rabItems, newItem];
        updateProject({ rabItems: newItems });
        setShowModal(false);
        setRabItemName('');
        setRabVol(0);
        setRabPrice(0);
        setSelectedAhsId(null);
    };

    const deleteRABItem = (id: number) => {
        if (!activeProject || !confirm('Hapus item RAB ini?')) return;
        const newItems = activeProject.rabItems.filter((i: RABItem) => i.id !== id);
        updateProject({ rabItems: newItems });
    };

    const handleUpdateProgress = () => {
        if (!activeProject || !selectedRabItem) return;
        const updatedRAB = activeProject.rabItems.map((item: RABItem) =>
            item.id === selectedRabItem.id ? { ...item, progress: progressInput } : item
        );
        const newLog: TaskLog = {
            id: Date.now(),
            date: progressDate,
            taskId: selectedRabItem.id,
            previousProgress: selectedRabItem.progress,
            newProgress: progressInput,
            note: progressNote
        };
        updateProject({
            rabItems: updatedRAB,
            taskLogs: [newLog, ...(activeProject.taskLogs || [])]
        });
        setShowModal(false);
    };

    const prepareEditRABItem = (item: RABItem) => {
        setSelectedRabItem(item);
        setRabCategory(item.category);
        setRabItemName(item.name);
        setRabUnit(item.unit);
        setRabVol(item.volume);
        setRabPrice(item.unitPrice);
        setModalType('newRAB');
        setShowModal(true);
    };

    // ========== Project Handlers ==========
    const handleSaveProject = async () => {
        if (!activeProject) {
            // Create new project
            const newP: any = {
                name: inputName,
                client: inputClient,
                location: inputLocation,
                ownerPhone: inputOwnerPhone,
                budgetLimit: inputBudget,
                startDate: inputStartDate,
                endDate: inputEndDate,
                heroImage: inputHeroImage,
                status: 'Berjalan',
                rabItems: [],
                transactions: [],
                workers: [],
                materials: [],
                materialLogs: [],
                tasks: [],
                attendanceLogs: [],
                attendanceEvidences: [],
                taskLogs: [],
                galleryItems: [],
                isDeleted: false
            };
            await addDoc(collection(db, 'app_data', appId, 'projects'), newP);
            setShowModal(false);
        } else {
            await updateProject({
                name: inputName,
                client: inputClient,
                location: inputLocation,
                ownerPhone: inputOwnerPhone,
                budgetLimit: inputBudget,
                startDate: inputStartDate,
                endDate: inputEndDate,
                heroImage: inputHeroImage,
            });
            setShowModal(false);
        }
    };

    const prepareEditProject = () => {
        if (!activeProject) return;
        setInputName(activeProject.name);
        setInputClient(activeProject.client);
        setInputLocation(activeProject.location);
        setInputOwnerPhone(activeProject.ownerPhone || '');
        setInputBudget(activeProject.budgetLimit);
        setInputStartDate(activeProject.startDate);
        setInputEndDate(activeProject.endDate);
        setInputHeroImage(activeProject.heroImage || '');
        setModalType('editProject');
        setShowModal(true);
    };

    // ========== Worker Handlers ==========
    const handlePayWorker = () => {
        if (!activeProject || !selectedWorkerId || paymentAmount <= 0) return;
        const newTx: Transaction = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            category: 'Upah Tukang',
            description: 'Gaji Tukang',
            amount: paymentAmount,
            type: 'expense',
            workerId: selectedWorkerId
        };
        updateProject({ transactions: [newTx, ...activeProject.transactions] });
        setShowModal(false);
    };

    // ========== Transaction Handlers (NEW) ==========
    const handleSaveTransaction = () => {
        if (!activeProject) return;
        if (paymentAmount <= 0 && (!props.transactionAmount || props.transactionAmount <= 0)) {
            // Fallback check if paymentAmount is reused, but we should use transactionAmount
            if (!props.transactionAmount || props.transactionAmount <= 0) {
                alert("Nominal wajib diisi!");
                return;
            }
        }

        const finalAmount = props.transactionAmount;
        const finalDate = props.transactionDate || new Date().toISOString().split('T')[0];
        const finalDesc = props.transactionDesc || 'Pengeluaran Umum';

        const newTx: Transaction = {
            id: Date.now(),
            date: finalDate,
            category: 'Pengeluaran Umum',
            description: finalDesc,
            amount: finalAmount,
            type: 'expense',
        };

        updateProject({
            transactions: [newTx, ...(activeProject.transactions || [])]
        });
        setShowModal(false);
    };

    const handleSaveWorker = () => {
        if (!activeProject) return;
        if (selectedWorkerId) {
            // Edit worker
            const updatedWorkers = activeProject.workers.map((w: Worker) => {
                if (w.id === selectedWorkerId) {
                    return {
                        ...w,
                        name: inputName,
                        role: inputWorkerRole as Worker['role'],
                        wageUnit: inputWageUnit as Worker['wageUnit'],
                        realRate: inputRealRate,
                        mandorRate: inputMandorRate
                    };
                }
                return w;
            });
            updateProject({ workers: updatedWorkers });
        } else {
            // New worker
            const newWorker: Worker = {
                id: Date.now(),
                name: inputName,
                role: inputWorkerRole as Worker['role'],
                wageUnit: inputWageUnit as Worker['wageUnit'],
                realRate: inputRealRate,
                mandorRate: inputMandorRate
            };
            updateProject({ workers: [...(activeProject.workers || []), newWorker] });
        }
        setShowModal(false);
    };

    const handleEditWorker = (w: Worker) => {
        setSelectedWorkerId(w.id);
        setInputName(w.name);
        setInputWorkerRole(w.role);
        setInputWageUnit(w.wageUnit);
        setInputRealRate(w.realRate);
        setInputMandorRate(w.mandorRate);
        setModalType('newWorker');
        setShowModal(true);
    };

    const handleDeleteWorker = (w: Worker) => {
        if (!activeProject) return;
        if (confirm(`Yakin hapus ${w.name}?`)) {
            const updatedWorkers = activeProject.workers.filter((worker: Worker) => worker.id !== w.id);
            updateProject({ workers: updatedWorkers });
        }
    };

    // ========== Material/Stock Handlers ==========
    const handleStockMovement = () => {
        // Debugging logs to identify why it might fail silently
        if (!activeProject) { console.error("No active project"); return; }
        if (!selectedMaterial) { console.error("No selected material"); return; }
        if (stockQty <= 0) {
            console.error("Stock qty invalid:", stockQty);
            alert("Jumlah update stok harus lebih dari 0");
            return;
        }

        const currentMaterials = activeProject.materials || [];
        const updatedMaterials = currentMaterials.map((m: Material) => {
            if (m.id === selectedMaterial.id) {
                const currentStock = m.stock || 0;
                // Calculate new stock
                let newStock = stockType === 'in' ? currentStock + stockQty : currentStock - stockQty;

                // Optional: Prevent negative stock? Or allow it? 
                // Let's allow it but maybe warn? For now just allow simple math.
                return { ...m, stock: newStock };
            }
            return m;
        });

        const newLog: MaterialLog = {
            id: Date.now(),
            materialId: selectedMaterial.id,
            date: stockDate,
            type: stockType,
            quantity: stockQty,
            notes: stockNotes || '-',
            actor: user?.displayName || 'User'
        };

        updateProject({
            materials: updatedMaterials,
            materialLogs: [newLog, ...(activeProject.materialLogs || [])]
        });
        setShowModal(false);
        setStockQty(0);
        setStockNotes('');
    };

    const handleSaveMaterial = () => {
        if (!activeProject || !inputMaterialName) return;

        // Note: Edit logic handled by handleEditMaterial

        const newMaterial: Material = {
            id: Date.now(),
            name: inputMaterialName,
            unit: inputMaterialUnit || 'pcs',
            stock: inputInitialStock,
            minStock: inputMinStock,
        };

        let newLogs: MaterialLog[] = [];
        if (inputInitialStock > 0) {
            newLogs = [{
                id: Date.now(),
                materialId: newMaterial.id,
                date: new Date().toISOString().split('T')[0],
                type: 'in',
                quantity: inputInitialStock,
                notes: 'Stok Awal',
                actor: user?.displayName || 'System'
            }];
        }

        updateProject({
            materials: [...(activeProject.materials || []), newMaterial],
            materialLogs: [...(activeProject.materialLogs || []), ...newLogs]
        });
        setShowModal(false);
        // Reset form done by ModalManager or App
    };

    const handleEditMaterial = () => {
        if (!activeProject || !selectedMaterial) return;

        const updatedMaterials = (activeProject.materials || []).map(m =>
            m.id === selectedMaterial.id
                ? { ...m, name: inputMaterialName, unit: inputMaterialUnit, minStock: inputMinStock }
                : m
        );

        updateProject({ materials: updatedMaterials });
        setShowModal(false);
    };

    const handleDeleteMaterial = (materialId: number) => {
        if (!activeProject) return;
        if (!window.confirm("Yakin hapus material ini?")) return;

        const updatedMaterials = (activeProject.materials || []).filter(m => m.id !== materialId);
        // We keep the logs for historical accuracy or delete them? 
        // Let's keep logs but they will point to non-existent material ID. 
        // Might cause issues if we try to display name from ID. 
        // But for "CRUD Material" request, deleting the item is enough.

        updateProject({ materials: updatedMaterials });
    };

    // ========== Attendance Handlers ==========
    const handleGetLocation = () => {
        if (!navigator.geolocation) return alert("Browser tidak support GPS");
        setIsGettingLoc(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setEvidenceLocation(`${pos.coords.latitude},${pos.coords.longitude}`);
                setIsGettingLoc(false);
            },
            (err) => {
                console.error(err);
                alert("Gagal ambil lokasi.");
                setIsGettingLoc(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file, 800, 0.6);
            setEvidencePhoto(compressed);
            handleGetLocation();
        } catch (e) {
            alert("Gagal memproses foto.");
            console.error(e);
        }
    };

    const saveAttendanceWithEvidence = async () => {
        if (!activeProject) return;
        if (!evidencePhoto) { alert("Wajib ambil foto bukti lapangan!"); return; }
        if (!evidenceLocation) { alert("Lokasi wajib terdeteksi!"); return; }

        const newLogs: any[] = [];
        let presentCount = 0;

        Object.keys(attendanceData).forEach(wId => {
            const status = attendanceData[Number(wId)].status;
            newLogs.push({
                id: Date.now() + Math.random(),
                date: attendanceDate,
                workerId: Number(wId),
                status: status,
                note: ''
            });
            if (status === 'Hadir' || status === 'Lembur' || status === 'Setengah') presentCount++;
        });

        // Upload photo to Firebase Storage
        let photoUrl = evidencePhoto;
        if (evidencePhoto.startsWith('data:image/')) {
            try {
                const { uploadAttendancePhoto } = await import('../utils/storageHelper');
                photoUrl = await uploadAttendancePhoto(evidencePhoto, activeProject.id, attendanceDate);
            } catch (e) {
                console.error('Failed to upload photo to storage, using base64 fallback:', e);
            }
        }

        let newEvidences = activeProject.attendanceEvidences || [];
        if (photoUrl || evidenceLocation) {
            newEvidences = [{
                id: Date.now(),
                date: attendanceDate,
                photoUrl: photoUrl,
                location: evidenceLocation,
                uploader: user?.displayName || 'Unknown',
                timestamp: new Date().toISOString()
            }, ...newEvidences];
        }

        await updateProject({
            attendanceLogs: [...activeProject.attendanceLogs, ...newLogs],
            attendanceEvidences: newEvidences
        });
        setShowModal(false);
        setEvidencePhoto(null);

        // WhatsApp Notification Logic
        if (confirm("Absensi tersimpan. Kirim laporan harian ke Grup/Bos (Kontraktor)?")) {
            const today = new Date().toISOString().split('T')[0];
            const todayMats = (activeProject.materialLogs || []).filter(m => m.date === today);
            const matText = todayMats.length > 0
                ? todayMats.map(m => `- ${activeProject.materials.find(x => x.id === m.materialId)?.name}: ${m.quantity} (${m.type})`).join('\n')
                : '- Nihil';

            const todayTx = (activeProject.transactions || []).filter(t => t.date === today);
            const income = todayTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
            const expense = todayTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

            const msg = `*Laporan Harian Internal: ${activeProject.name}*\n📅 ${today}\n\n👷 Absensi: ${presentCount} Tukang\n\n📦 Material:\n${matText}\n\n💰 Cashflow Hari Ini:\nMasuk: ${formatRupiah(income)}\nKeluar: ${formatRupiah(expense)}\n\n📍 Lokasi: https://maps.google.com/?q=${evidenceLocation}\n\n_Laporan via Guna Karya_`;

            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        }
    };

    // ========== Owner Report ==========
    const handleReportToOwner = () => {
        if (!activeProject || !activeProject.ownerPhone) {
            return alert("Nomor WA Owner belum diisi di Pengaturan Proyek!");
        }

        const stats = calculateProjectHealth(activeProject);
        const clientLink = `${window.location.origin}?projectId=${activeProject.id}&mode=client`;

        let phone = activeProject.ownerPhone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '62' + phone.substring(1);

        const msg = `*Update Sore Proyek: ${activeProject.name}*\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n📈 Progress Real: ${stats.realProgress.toFixed(2)}%\n⚠️ Status: ${stats.issues.length ? stats.issues.join(', ') : 'Aman'}\n\nPantau detail & foto di portal klien:\n${clientLink}\n\n_Dikirim otomatis jam 17.00 WIB_`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    // ========== AI RAB Generator ==========
    const generateOfflineRAB = (prompt: string) => {
        const p = prompt.toLowerCase();
        const items = [];

        let width = 6, length = 10;
        const dimMatch = p.match(/(\d+)\s*x\s*(\d+)/);
        if (dimMatch) { width = parseInt(dimMatch[1]); length = parseInt(dimMatch[2]); }
        const area = width * length;

        let floors = 1;
        if (p.includes('lantai 2') || p.includes('2 lantai')) floors = 2;
        if (p.includes('lantai 3') || p.includes('3 lantai')) floors = 3;

        const totalArea = area * floors;
        const keliling = (width + length) * 2;
        const wallHeight = floors * 3.5;
        const wallArea = keliling * wallHeight;

        items.push({ category: 'A. PERSIAPAN', name: 'Pembersihan Lahan', unit: 'm2', volume: area, unitPrice: 15000 });
        items.push({ category: 'A. PERSIAPAN', name: 'Pemasangan Bowplank', unit: 'm1', volume: keliling + 4, unitPrice: 45000 });
        items.push({ category: 'B. TANAH & PONDASI', name: 'Galian Tanah Pondasi', unit: 'm3', volume: keliling * 0.6, unitPrice: 85000 });
        items.push({ category: 'B. TANAH & PONDASI', name: 'Pondasi Batu Kali', unit: 'm3', volume: keliling * 0.25, unitPrice: 950000 });
        items.push({ category: 'C. BETON', name: 'Sloof 15/20', unit: 'm3', volume: keliling * 0.03, unitPrice: 3500000 });
        if (floors > 1) {
            items.push({ category: 'C. BETON', name: 'Plat Lantai Beton', unit: 'm3', volume: (area * 0.12), unitPrice: 3800000 });
            items.push({ category: 'C. BETON', name: 'Kolom Praktis', unit: 'm3', volume: (floors * 12 * 3.5 * 0.02), unitPrice: 3500000 });
        }
        items.push({ category: 'D. DINDING', name: 'Pasangan Bata Merah', unit: 'm2', volume: wallArea * 0.85, unitPrice: 125000 });
        items.push({ category: 'D. DINDING', name: 'Plesteran Dinding', unit: 'm2', volume: wallArea * 1.7, unitPrice: 65000 });
        items.push({ category: 'D. DINDING', name: 'Acian Dinding', unit: 'm2', volume: wallArea * 1.7, unitPrice: 35000 });
        items.push({ category: 'E. LANTAI', name: 'Pasang Keramik 60x60', unit: 'm2', volume: totalArea, unitPrice: 200000 });
        items.push({ category: 'F. PLAFOND', name: 'Plafond Gypsum', unit: 'm2', volume: totalArea, unitPrice: 95000 });
        items.push({ category: 'G. PENGECATAN', name: 'Cat Dinding', unit: 'm2', volume: wallArea * 1.7, unitPrice: 25000 });
        items.push({ category: 'H. INSTALASI', name: 'Titik Lampu & Saklar', unit: 'titik', volume: 10 * floors, unitPrice: 250000 });

        return items;
    };

    const handleGenerateRAB = async () => {
        if (!aiPrompt) return alert("Masukkan deskripsi proyek dulu!");
        setIsGeneratingAI(true);

        const integrateWithAHS = (items: any[]) => {
            if (!ahsItems || ahsItems.length === 0) return items;

            return items.map((item: any) => {
                const keywords = (item.name || '').toLowerCase().replace(/[^\w\s]/gi, '').split(' ').filter((k: string) => k.length > 3);
                let bestMatch: AHSItem | null = null;
                let maxScore = 0;

                ahsItems.forEach((ahs: AHSItem) => {
                    let score = 0;
                    const ahsName = (ahs.name || '').toLowerCase();

                    if (item.category && ahs.category && item.category.split('.')[0] === ahs.category.split('.')[0]) {
                        score += 2;
                    }

                    let matchedKeywords = 0;
                    keywords.forEach((k: string) => {
                        if (ahsName.includes(k)) matchedKeywords++;
                    });
                    score += matchedKeywords * 3;

                    if (score > maxScore && matchedKeywords >= 1) {
                        maxScore = score;
                        bestMatch = ahs;
                    }
                });

                if (bestMatch) {
                    const match = bestMatch as AHSItem;
                    return {
                        ...item,
                        name: match.name,
                        unit: match.unit,
                        unitPrice: calculateAHSTotal(match),
                        ahsItemId: match.id
                    };
                }
                return item;
            });
        };

        const runOffline = () => {
            const items = generateOfflineRAB(aiPrompt);
            const matchedItems = integrateWithAHS(items);
            const newItems = matchedItems.map((i: any) => ({ ...i, id: Date.now() + Math.random(), progress: 0, isAddendum: false }));
            if (activeProject) {
                updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
                alert(`Mode Estimasi Cepat: Berhasil membuat ${newItems.length} item RAB (Offline Mode). Beberapa item mungkin telah disesuaikan dengan AHS.`);
                setShowModal(false);
            }
        };

        const apiKey = "AIzaSyB7ta6cVVnYp0JQMUSnv1rMSNZivr9_p4E";
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Buatkan RAB konstruksi lengkap untuk: ${aiPrompt}. \nOutput JSON array of objects: {category, name, unit, volume, unitPrice}. \nGunakan Bahasa Indonesia. Gunakan harga standar Jakarta 2024. \nKategori harus urut abjad: A. PERSIAPAN, B. TANAH, C. STRUKTUR, D. DINDING, dll. HANYA JSON RAW tanpa markdown.`
                        }]
                    }]
                })
            });

            if (!response.ok) throw new Error("API Error");
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const items = JSON.parse(cleanJson);

            if (!Array.isArray(items)) throw new Error("Invalid Format");

            const matchedItems = integrateWithAHS(items);
            const newItems = matchedItems.map((i: any) => ({ ...i, id: Date.now() + Math.random(), progress: 0, isAddendum: false }));

            if (activeProject) {
                updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
                alert(`Berhasil generate RAB! Beberapa item otomatis terhubung ke AHS.`);
                setShowModal(false);
            }
        } catch (e) {
            console.warn("Switching to offline generator:", e);
            runOffline();
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleImportRAB = (importedItems: any[]) => {
        if (!activeProject) return;
        const newItems = importedItems.map(item => ({
            id: Date.now() + Math.random(),
            category: item.Kategori || item.category || 'Uncategorized',
            name: item['Nama Item'] || item.name || 'Unnamed Item',
            unit: item.Satuan || item.unit || 'ls',
            volume: Number(item.Volume || item.volume) || 0,
            unitPrice: Number(item['Harga Satuan'] || item.unitPrice) || 0,
            progress: 0,
            isAddendum: false
        }));
        updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
        alert(`Berhasil import ${newItems.length} item dari Excel!`);
        setShowModal(false);
    };

    const handleSaveSchedule = async () => {
        if (!activeProject || !selectedRabItem) return;

        const updatedItems = activeProject.rabItems.map(item => {
            if (item.id === selectedRabItem.id) {
                return { ...item, startDate: inputStartDate, endDate: inputEndDate };
            }
            return item;
        });

        try {
            await updateDoc(doc(db, 'app_data', appId, 'projects', activeProject.id), { rabItems: updatedItems });
            setShowModal(false);
            if (setModalType) setModalType(''); // Fix TS error: string | null mismatch
        } catch (error) {
            console.error("Error save schedule:", error);
            alert("Gagal menyimpan jadwal.");
        }
    };

    const prepareEditSchedule = (item: RABItem) => {
        if (setSelectedRabItem) setSelectedRabItem(item);
        setInputStartDate(item.startDate || activeProject?.startDate || '');
        setInputEndDate(item.endDate || activeProject?.endDate || '');
        openModal('itemSchedule');
    };

    // ========== Modal Opener ==========
    const openModal = (type: string) => {
        if (type === 'newProject') {
            setActiveProjectId(null);
            setInputName('');
            setInputClient('');
            setInputLocation('');
            setInputOwnerPhone('');
            setInputBudget(0);
            setInputStartDate('');
            setInputEndDate('');
            setInputHeroImage('');
        }
        if (type === 'newRAB' && !selectedRabItem) {
            setRabCategory('');
            setRabItemName('');
            setRabUnit('');
            setRabVol(0);
            setRabPrice(0);
        }
        if (type === 'newWorker' && !selectedWorkerId) {
            setInputName('');
            setInputWorkerRole('Tukang');
            setInputWageUnit('Harian');
            setInputRealRate(0);
            setInputMandorRate(0);
        }
        if (type === 'newMaterial') {
            if (setSelectedMaterial) setSelectedMaterial(null);
            setInputMaterialName('');
            setInputMaterialUnit('pcs');
            setInputMinStock(10);
            setInputInitialStock(0);
            setInputInitialStock(0);
        }
        if (type === 'newTransaction') {
            props.setTransactionDesc('');
            props.setTransactionAmount(0);
            props.setTransactionDate(new Date().toISOString().split('T')[0]);
        }
        setModalType(type);
        setShowModal(true);
    };

    // ========== Deleters & Helpers ==========
    const handleSoftDeleteProject = async (p: Project) => {
        if (confirm(`Yakin ingin memindahkan proyek "${p.name}" ke Sampah?`)) {
            try {
                await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: true });
            } catch (e) {
                alert("Gagal menghapus.");
            }
        }
    };

    const handleRestoreProject = async (p: Project) => {
        try {
            await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: false });
        } catch (e) {
            alert("Gagal restore.");
        }
    };

    const handlePermanentDeleteProject = async (p: Project) => {
        if (confirm(`PERINGATAN: Proyek "${p.name}" akan dihapus SELAMANYA dan tidak bisa dikembalikan. Lanjutkan?`)) {
            try {
                await deleteDoc(doc(db, 'app_data', appId, 'projects', p.id));
            } catch (e) {
                alert("Gagal hapus permanen.");
            }
        }
    };

    const getFilteredEvidence = () => {
        if (!activeProject || !activeProject.attendanceEvidences) return [];
        return activeProject.attendanceEvidences;
    };

    return {
        // RAB
        handleSaveRAB,
        deleteRABItem,
        handleUpdateProgress,
        prepareEditRABItem,
        // Project
        handleSaveProject,
        prepareEditProject,
        handleSoftDeleteProject,
        handleRestoreProject,
        handlePermanentDeleteProject,
        handlePayWorker,
        handleSaveWorker,
        handleEditWorker,
        handleDeleteWorker,
        handleSaveTransaction, // NEW
        // Material/Stock
        handleStockMovement,
        handleSaveMaterial,
        handleEditMaterial,
        handleDeleteMaterial,
        // Attendance
        handleGetLocation,
        handlePhotoUpload,
        saveAttendanceWithEvidence,
        getFilteredEvidence,
        // Owner Report
        handleReportToOwner,
        // AI RAB
        handleGenerateRAB,
        handleImportRAB,
        handleSaveSchedule,
        // Modal
        openModal,
        prepareEditSchedule,
    };
};

export default useProjectHandlers;
