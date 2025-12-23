import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, appId, firebaseConfig } from '../lib/firebase';
import type {
    Project, RABItem, Transaction, Worker, Material, MaterialLog, TaskLog, AHSItem, WeeklyReport, CashAdvance, Equipment, Subkon
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
    aiFloorPlanImage: string | null;
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
    transactionType?: 'expense' | 'income';
    transactionCategory?: string;
    transactionProof?: string | null;
    setTransactionDesc: (v: string) => void;
    setTransactionAmount: (v: number) => void;
    setTransactionDate: (v: string) => void;
    setTransactionProof?: (v: string | null) => void;

    setInputStartDate: (v: string) => void;
    setInputEndDate: (v: string) => void;
    setInputHeroImage: (v: string) => void;
    setStockNotes: (v: string) => void;
    setEvidencePhoto: (v: string | null) => void;
    setEvidenceLocation: (v: string | null) => void;
    setIsGettingLoc: (v: boolean) => void;
    setIsGeneratingAI: (v: boolean) => void;
    setSelectedRabItem: (v: RABItem | null) => void;
    setSelectedWorkerId: (v: number | null) => void;
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
        selectedRabItem,
        progressInput, progressDate, progressNote, paymentAmount, selectedWorkerId,
        selectedMaterial,
        attendanceDate, attendanceData, evidencePhoto, evidenceLocation, aiPrompt, aiFloorPlanImage,
        setInputName, setInputClient, setInputLocation, setInputOwnerPhone, setInputBudget, setInputStartDate, setInputEndDate, setInputHeroImage,
        setSelectedRabItem,
        setSelectedWorkerId,
        setEvidencePhoto, setEvidenceLocation, setIsGettingLoc, setIsGeneratingAI, setActiveProjectId,
        setSelectedMaterial
    } = props;

    // ========== RAB Handlers ==========
    const handleSaveRAB = (data: {
        category: string,
        name: string,
        unit: string,
        vol: number,
        price: number,
        ahsId?: string | null
    }) => {
        if (!activeProject) return;
        const isNewItem = !selectedRabItem;
        const newItem: RABItem = {
            id: selectedRabItem ? selectedRabItem.id : Date.now(),
            category: data.category,
            name: data.name,
            unit: data.unit,
            volume: data.vol,
            unitPrice: data.price,
            progress: selectedRabItem?.progress || 0,
            isAddendum: selectedRabItem?.isAddendum || false,
            priceLockedAt: isNewItem ? new Date().toISOString() : (selectedRabItem?.priceLockedAt || new Date().toISOString()),
            ahsId: data.ahsId || undefined,
            ahsItemId: isNewItem ? (data.ahsId || undefined) : (selectedRabItem?.ahsItemId || data.ahsId || undefined)
        };
        const newItems = selectedRabItem
            ? activeProject.rabItems.map((i: RABItem) => i.id === newItem.id ? newItem : i)
            : [...activeProject.rabItems, newItem];
        updateProject({ rabItems: newItems });
        setShowModal(false);
    };

    const deleteRABItem = async (id: number) => {
        if (!activeProject) return;

        // Use window.confirm explicitly and ensure it blocks
        if (!window.confirm('Hapus item RAB ini?')) return;

        console.log("Menghapus item RAB ID:", id);

        // Optimistic UI handled in useProjects, but we define the new state here
        const newItems = activeProject.rabItems.filter((i: RABItem) => String(i.id) !== String(id));

        // Ensure we are actually removing something
        if (newItems.length === activeProject.rabItems.length) {
            alert(`Gagal menghapus: Item ID ${id} tidak ditemukan.`);
            return;
        }

        await updateProject({ rabItems: newItems });
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
        setModalType('newRAB');
        setShowModal(true);
    };

    // ========== Auto Schedule Generator (NEW) ==========
    // ========== Auto Schedule Generator (NEW) ==========
    const handleAutoSchedule = async (mode: '1' | '2') => {
        if (!activeProject) return;
        if (!activeProject.startDate || !activeProject.endDate) {
            alert("Mohon isi Tanggal Mulai dan Selesai Proyek terlebih dahulu di Pengaturan Proyek!");
            return;
        }

        try {
            const { generateSmartSchedule, getSchedulePreview } = await import('../utils/scheduleGenerator');

            // Generate Analysis
            const analysisLines = getSchedulePreview(activeProject);
            const analysisText = analysisLines.join('\n');

            const updatedItems = generateSmartSchedule(activeProject, { keepExisting: mode === '2' });
            if (updatedItems.length > 0) {
                // Save Items AND the Analysis Text
                await updateProject({
                    rabItems: updatedItems,
                    scheduleAnalysis: analysisText
                });
                alert('Jadwal berhasil diupdate! Analisa kebutuhan tukang telah disimpan.');
            } else {
                alert('Gagal membuat jadwal.');
            }
        } catch (e) {
            console.error(e);
            alert('Terjadi kesalahan saat membuat jadwal.');
        }
    };

    // ========== Weekly Report Generator ==========
    const handleGenerateWeeklyReport = async (notes: string = '') => {
        if (!activeProject) return;

        // 1. Calculate Stats
        const { realProgress, planProgress } = calculateProjectHealth(activeProject);
        const deviation = realProgress - planProgress;

        // 2. Week Calculation
        const pStart = new Date(activeProject.startDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - pStart.getTime());
        const weekNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

        if (weekNumber < 1) {
            alert("Proyek belum berjalan 1 minggu.");
            return;
        }

        // 3. Compare with Previous
        const safeReports = activeProject.weeklyReports || [];
        // Check if report for this week already exists?
        // Let's iterate to find if weekNumber exists.
        const existingIndex = safeReports.findIndex(r => r.weekNumber === weekNumber);

        if (existingIndex !== -1 && !confirm(`Laporan Minggu ke-${weekNumber} sudah ada. Timpa?`)) return;

        // Get Last Report for Trend
        // Sort by week desc
        const sortedReports = [...safeReports].sort((a, b) => b.weekNumber - a.weekNumber);
        const lastReport = sortedReports.find(r => r.weekNumber < weekNumber); // Find closest previous week

        let trend: 'Improving' | 'Worsening' | 'Stable' = 'Stable';
        const previousDev = lastReport ? lastReport.deviation : 0;

        // Trend Logic:
        // Improving if we are Catching Up (Positive Delta in Deviation)
        // OR if Deviation was -5, and now is -3. (Diff is +2).
        // If Deviation was +2 and now is +4 (Diff +2). That's actually "Advancing".
        // Let's define "Improving" as: The gap between Real and Plan is shrinking (if negative) or growing (if positive).
        // Simpler: Is current deviation better than previous?
        // If Prev = -5%, Curr = -3%. Better.
        // If Prev = +2%, Curr = +1%. Worse (slowed down). 
        // So simply: trend = (deviation - previousDev) > 0 ? Improving : Worsening

        // However, user specifically asked for "Deviasi minggu sebelumnya".
        // Let's use simple logic: 
        if (deviation > previousDev) trend = 'Improving';
        else if (deviation < previousDev) trend = 'Worsening';
        else trend = 'Stable';

        const weekStart = new Date(pStart.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

        const newReport: WeeklyReport = {
            id: Date.now().toString(),
            weekNumber,
            startDate: weekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0],
            createdDate: new Date().toISOString(),
            planProgress,
            realProgress,
            deviation,
            previousDeviation: previousDev,
            trend,
            notes,
            status: 'Submitted'
        };

        let updatedReports = [...safeReports];
        if (existingIndex !== -1) {
            updatedReports[existingIndex] = newReport;
        } else {
            updatedReports.push(newReport);
        }

        try {
            await updateProject({ weeklyReports: updatedReports });
            alert(`Laporan Minggu ke-${weekNumber} berhasil disimpan!`);
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan laporan.");
        }
    };

    const handleUpdateWeeklyReport = async (reportId: string, notes: string) => {
        if (!activeProject || !activeProject.weeklyReports) return;

        const updatedReports = activeProject.weeklyReports.map(r =>
            r.id === reportId ? { ...r, notes } : r
        );

        try {
            await updateProject({ weeklyReports: updatedReports });
            // alert("Catatan laporan diperbarui!"); // Silent update is better for text edits? Or small toast.
        } catch (e) {
            console.error(e);
            alert("Gagal memperbarui catatan.");
        }
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
    const handleSaveTransaction = async () => {
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

        const finalCategory = props.transactionCategory || (props.transactionType === 'income' ? 'Termin' : 'Pengeluaran Umum');

        // Handle Proof Upload - only upload if there's actual image data
        let proofUrl: string | null = null;
        if (props.transactionProof && props.transactionProof.startsWith('data:image/')) {
            try {
                const { uploadGalleryPhoto } = await import('../utils/storageHelper');
                // Use gallery bucket for transaction proofs too
                proofUrl = await uploadGalleryPhoto(props.transactionProof, activeProject.id);
            } catch (e) {
                console.error("Proof upload failed", e);
                // Keep proofUrl as null if upload fails
            }
        } else if (props.transactionProof && props.transactionProof.startsWith('http')) {
            // Already a URL, use it directly
            proofUrl = props.transactionProof;
        }

        // Build transaction object - only include proofUrl if it has a value
        // Firebase doesn't accept undefined values
        const newTx: Transaction = {
            id: Date.now(),
            date: finalDate,
            category: finalCategory,
            description: finalDesc,
            amount: finalAmount,
            type: props.transactionType || 'expense',
            ...(proofUrl ? { proofUrl } : {}),  // Only add proofUrl if it exists
        };

        await updateProject({
            transactions: [newTx, ...(activeProject.transactions || [])]
        });

        // Reset form fields after successful save
        props.setTransactionDesc('');
        props.setTransactionAmount(0);
        props.setTransactionDate(new Date().toISOString().split('T')[0]);
        if (props.setTransactionProof) props.setTransactionProof(null);

        setShowModal(false);
    };

    const handleSaveWorker = (data: {
        name: string,
        role: string,
        wageUnit: string,
        realRate: number,
        mandorRate: number,
        cashAdvanceLimit: number
    }) => {
        if (!activeProject) return;

        let updatedWorkers;
        if (selectedWorkerId) {
            // Edit worker
            updatedWorkers = activeProject.workers.map((w: Worker) => {
                if (w.id === selectedWorkerId) {
                    return {
                        ...w,
                        name: data.name,
                        role: data.role as Worker['role'],
                        wageUnit: data.wageUnit as Worker['wageUnit'],
                        realRate: data.realRate,
                        mandorRate: data.mandorRate,
                        cashAdvanceLimit: data.cashAdvanceLimit
                    };
                }
                return w;
            });
        } else {
            // New worker
            const newWorker: Worker = {
                id: Date.now(),
                name: data.name,
                role: data.role as Worker['role'],
                wageUnit: data.wageUnit as Worker['wageUnit'],
                realRate: data.realRate,
                mandorRate: data.mandorRate,
                cashAdvanceLimit: data.cashAdvanceLimit
            };
            updatedWorkers = [...(activeProject.workers || []), newWorker];
        }

        updateProject({ workers: updatedWorkers });
        setShowModal(false);
    };

    const handleEditWorker = (w: Worker) => {
        setSelectedWorkerId(w.id);
        openModal('newWorker');
    };

    const handleDeleteWorker = (w: Worker) => {
        if (!activeProject) return;
        if (confirm(`Yakin hapus ${w.name}?`)) {
            const updatedWorkers = activeProject.workers.filter((worker: Worker) => worker.id !== w.id);
            updateProject({ workers: updatedWorkers });
        }
    };

    // ========== Material/Stock Handlers ==========
    const handleStockMovement = (
        material: Material,
        type: 'in' | 'out',
        qty: number,
        date: string,
        notes: string
    ) => {
        if (!activeProject) { console.error("No active project"); return; }
        if (qty <= 0) {
            alert("Jumlah update stok harus lebih dari 0");
            return;
        }

        const currentMaterials = activeProject.materials || [];
        const updatedMaterials = currentMaterials.map((m: Material) => {
            if (m.id === material.id) {
                const currentStock = m.stock || 0;
                let newStock = type === 'in' ? currentStock + qty : currentStock - qty;
                return { ...m, stock: newStock };
            }
            return m;
        });

        const newLog: MaterialLog = {
            id: Date.now(),
            materialId: material.id,
            date: date,
            type: type,
            quantity: qty,
            notes: notes || '-',
            actor: user?.displayName || 'User'
        };

        updateProject({
            materials: updatedMaterials,
            materialLogs: [newLog, ...(activeProject.materialLogs || [])]
        });
        setShowModal(false);
        // State reset handled by Modal component unmounting/resetting
    };

    const handleSaveMaterial = (
        name: string,
        unit: string,
        minStock: number,
        initialStock: number
    ) => {
        if (!activeProject || !name) return;

        const newMaterial: Material = {
            id: Date.now(),
            name: name,
            unit: unit || 'pcs',
            stock: initialStock,
            minStock: minStock,
        };

        let newLogs: MaterialLog[] = [];
        if (initialStock > 0) {
            newLogs = [{
                id: Date.now(),
                materialId: newMaterial.id,
                date: new Date().toISOString().split('T')[0],
                type: 'in',
                quantity: initialStock,
                notes: 'Stok Awal',
                actor: user?.displayName || 'System'
            }];
        }

        updateProject({
            materials: [...(activeProject.materials || []), newMaterial],
            materialLogs: [...(activeProject.materialLogs || []), ...newLogs]
        });
        setShowModal(false);
    };

    const handleEditMaterial = (
        name: string,
        unit: string,
        minStock: number
    ) => {
        if (!activeProject || !selectedMaterial) return;

        const updatedMaterials = (activeProject.materials || []).map(m =>
            m.id === selectedMaterial.id
                ? { ...m, name: name, unit: unit, minStock: minStock }
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

    // ========== Transfer Material Between Projects ==========
    const handleTransferMaterial = async (
        _sourceProjectId: string,
        targetProjectId: string,
        material: Material,
        quantity: number,
        notes: string,
        date: string,
        targetProjectName: string
    ) => {
        if (!activeProject) return;
        if (quantity <= 0) {
            alert("Jumlah transfer harus lebih dari 0");
            return;
        }
        if (material.stock < quantity) {
            alert(`Stok tidak cukup! Tersedia: ${material.stock} ${material.unit}`);
            return;
        }

        const today = date || new Date().toISOString().split('T')[0];

        // 1. Kurangi stok di proyek sumber (current project)
        const updatedSourceMaterials = (activeProject.materials || []).map(m => {
            if (m.id === material.id) {
                return { ...m, stock: m.stock - quantity };
            }
            return m;
        });

        // Log transfer_out di proyek sumber
        const transferOutLog: MaterialLog = {
            id: Date.now(),
            materialId: material.id,
            date: today,
            type: 'transfer_out',
            quantity: quantity,
            notes: notes || `Kirim ke ${targetProjectName}`,
            actor: user?.displayName || 'User',
            transferProjectId: targetProjectId,
            transferProjectName: targetProjectName
        };

        await updateProject({
            materials: updatedSourceMaterials,
            materialLogs: [transferOutLog, ...(activeProject.materialLogs || [])]
        });

        // 2. Tambah stok di proyek tujuan (via direct Firestore update)
        try {
            const targetProjectRef = doc(db, 'app_data', appId, 'projects', targetProjectId);
            const { getDoc } = await import('firebase/firestore');
            const targetSnap = await getDoc(targetProjectRef);

            if (!targetSnap.exists()) {
                alert("Proyek tujuan tidak ditemukan!");
                return;
            }

            const targetData = targetSnap.data() as Project;
            let targetMaterials = targetData.materials || [];
            let finalMaterialId: number;

            // Cari material yang sama di target (Case Insensitive + Same Unit)
            const existingMaterial = targetMaterials.find(m =>
                m.name.trim().toLowerCase() === material.name.trim().toLowerCase() &&
                m.unit.toLowerCase() === material.unit.toLowerCase()
            );

            if (existingMaterial) {
                // Update existing material in target
                finalMaterialId = existingMaterial.id;
                targetMaterials = targetMaterials.map(m => {
                    if (m.id === existingMaterial.id) {
                        return { ...m, stock: m.stock + quantity };
                    }
                    return m;
                });
            } else {
                // Create new material in target (sama nama)
                const newMat: Material = {
                    id: Date.now(),
                    name: material.name,
                    unit: material.unit,
                    stock: quantity,
                    minStock: material.minStock
                };
                finalMaterialId = newMat.id;
                targetMaterials = [...targetMaterials, newMat];
            }

            // Log transfer_in di proyek tujuan
            const transferInLog: MaterialLog = {
                id: Date.now() + 1,
                materialId: finalMaterialId,
                date: today,
                type: 'transfer_in',
                quantity: quantity,
                notes: `Terima dari ${activeProject.name}`,
                actor: user?.displayName || 'User',
                transferProjectId: activeProject.id,
                transferProjectName: activeProject.name
            };

            await updateDoc(targetProjectRef, {
                materials: targetMaterials,
                materialLogs: [transferInLog, ...(targetData.materialLogs || [])]
            });

            alert(`✅ Transfer ${quantity} ${material.unit} ${material.name} ke "${targetProjectName}" berhasil!`);
            setShowModal(false);
        } catch (e) {
            console.error("Transfer error:", e);
            alert("Gagal transfer ke proyek tujuan. Cek console.");
        }
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

    const saveAttendanceWithEvidence = async (dailyNotes?: { weather: string; issues: string; visitors: string }) => {
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
                timestamp: new Date().toISOString(),
                // Site Diary data
                weather: dailyNotes?.weather as any,
                issues: dailyNotes?.issues || undefined,
                visitors: dailyNotes?.visitors || undefined
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
            // Load Settings
            let config = { showAbsensi: true, showMaterial: true, showCashflow: true, showLocation: true };
            try {
                const saved = localStorage.getItem('wa_report_config');
                if (saved) config = JSON.parse(saved);
            } catch (e) {
                console.error("Error loading config", e);
            }

            const today = new Date().toISOString().split('T')[0];
            let msg = `*Laporan Harian Audit/Internal: ${activeProject.name}*\n📅 ${today}\n`;

            if (config.showAbsensi) {
                msg += `\n👷 Absensi: ${presentCount} Tukang\n`;
            }

            if (config.showMaterial) {
                const todayMats = (activeProject.materialLogs || []).filter(m => m.date === today);
                const matText = todayMats.length > 0
                    ? todayMats.map(m => `- ${activeProject.materials.find(x => x.id === m.materialId)?.name}: ${m.quantity} (${m.type})`).join('\n')
                    : '- Nihil';
                msg += `\n📦 Material:\n${matText}\n`;
            }

            if (config.showCashflow) {
                const todayTx = (activeProject.transactions || []).filter(t => t.date === today);
                const income = todayTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
                const expense = todayTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
                msg += `\n💰 Cashflow Hari Ini:\nMasuk: ${formatRupiah(income)}\nKeluar: ${formatRupiah(expense)}\n`;
            }

            if (config.showLocation) {
                msg += `\n📍 Lokasi: https://maps.google.com/?q=${evidenceLocation}\n`;
            }

            msg += `\n_Laporan via Guna Karya_`;

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
        if (!aiPrompt && !aiFloorPlanImage) return alert("Masukkan deskripsi proyek atau upload gambar denah!");
        setIsGeneratingAI(true);

        // Post-processing: Validate and correct unrealistic volumes
        const validateAndCorrectVolumes = (items: any[]) => {
            console.log('[RAB Validator] Starting validation on', items.length, 'items');

            // Find ALL wall area items (m²) in DINDING category - more permissive matching
            const wallAreaItems = items.filter((i: any) =>
                i.category?.toUpperCase().includes('DINDING') &&
                (i.unit === 'm2' || i.unit === 'm²' || i.unit?.toLowerCase() === 'm2')
            );

            console.log('[RAB Validator] Found wall area items:', wallAreaItems.map((i: any) => ({ name: i.name, volume: i.volume, unit: i.unit })));

            // Get reference wall area (the largest m² item in DINDING category)
            const maxWallArea = wallAreaItems.length > 0
                ? Math.max(...wallAreaItems.map((i: any) => Number(i.volume) || 0))
                : 0;

            console.log('[RAB Validator] Max wall area reference:', maxWallArea, 'm²');

            // Standard wall thickness is 0.15m for bata merah
            const STANDARD_WALL_THICKNESS = 0.15;
            const MAX_VOLUME_RATIO = 0.2; // Volume should never exceed 20% of area

            const processedItems = items.map((item: any) => {
                const itemCategory = item.category?.toUpperCase() || '';
                const itemUnit = item.unit?.toLowerCase() || '';

                // Check if this is a wall volume item (m³) 
                if (itemCategory.includes('DINDING') && (itemUnit === 'm3' || itemUnit === 'm³')) {
                    const volume = Number(item.volume) || 0;
                    console.log('[RAB Validator] Checking m³ item:', item.name, 'Volume:', volume);

                    // If we have a reference wall area, validate against it
                    if (maxWallArea > 0) {
                        const expectedMaxVolume = maxWallArea * MAX_VOLUME_RATIO;
                        console.log('[RAB Validator] Expected max volume:', expectedMaxVolume, 'Actual:', volume);

                        if (volume > expectedMaxVolume) {
                            // Recalculate using standard thickness
                            const correctedVolume = Math.round(maxWallArea * STANDARD_WALL_THICKNESS * 100) / 100;
                            console.warn(`[RAB Validator] ✅ CORRECTED wall volume: ${volume} m³ → ${correctedVolume} m³ (based on ${maxWallArea} m² wall area)`);
                            return { ...item, volume: correctedVolume };
                        }
                    }

                    // Fallback: If volume seems unreasonably large (>100 m³ for typical building)
                    if (volume > 100) {
                        const correctedVolume = Math.round(volume * 0.15 * 100) / 100; // Assume AI gave m² instead of m³
                        console.warn(`[RAB Validator] ✅ CORRECTED large volume: ${volume} m³ → ${correctedVolume} m³`);
                        return { ...item, volume: correctedVolume };
                    }
                }

                const name = item.name?.toLowerCase() || '';
                let cleanVol = String(item.volume).replace(/[^0-9.]/g, '');
                const volume = Number(cleanVol) || 0;
                item.volume = volume;

                // 3. Global Special Checks (regardless of category)

                // Bedeng / Gudang / Kantor Sementara -> Max 40 m2
                if ((name.includes('bedeng') || name.includes('kantor') || name.includes('gudang')) && volume > 40) {
                    const corrected = 24; // 4x6m standard
                    console.warn(`[RAB Validator] 🏠 CORRECTED Bedeng Volume (Global): ${volume} m2 -> ${corrected} m2`);
                    return { ...item, volume: corrected };
                }

                // Pagar Sementara -> Max 200 m
                if (name.includes('pagar') && volume > 200) {
                    const corrected = 100;
                    return { ...item, volume: corrected };
                }

                // Bongkar / Pembongkaran -> Max 50 m3
                if ((name.includes('bongkar') || name.includes('demolition')) && volume > 50) {
                    const corrected = 20;
                    console.warn(`[RAB Validator] 🔨 CORRECTED Demolition Volume: ${volume} m3 -> ${corrected} m3`);
                    return { ...item, volume: corrected };
                }

                return item;
            });

            // Deduplicate items (Strict normalization)
            const uniqueItems: any[] = [];
            processedItems.forEach(item => {
                const normalize = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, '');
                const existing = uniqueItems.find(u =>
                    normalize(u.name) === normalize(item.name) &&
                    normalize(u.category) === normalize(item.category)
                );
                if (!existing) uniqueItems.push(item);
            });

            // 4. PRE-CALCULATE DATA FOR INJECTIONS
            // Get Total Floor Area estimate (from Lantai or Plafond items)
            const floorItems = uniqueItems.filter(i =>
                (i.category?.toUpperCase().includes('LANTAI') || i.category?.toUpperCase().includes('PLAFOND')) &&
                (i.unit === 'm2' || i.unit === 'm²' || i.unit?.toLowerCase().trim() === 'm2')
            );
            const maxFloorArea = floorItems.length > 0
                ? Math.max(...floorItems.map(i => Number(String(i.volume).replace(/[^0-9.]/g, '')) || 0))
                : 0;

            console.log('[RAB Validator] 📏 Estimated Floor Area:', maxFloorArea, 'm2');

            // 5. INJECT MISSING CORE ITEMS (Hybrid Approach)

            // A. Dinding (Existing Logic)
            const hasPasanganDinding = uniqueItems.some(i =>
                i.category?.toUpperCase().includes('DINDING') &&
                (i.name?.toLowerCase().includes('pasangan') || i.name?.toLowerCase().includes('bata') || i.name?.toLowerCase().includes('hebel'))
            );

            if (maxWallArea > 20 && !hasPasanganDinding) {
                console.warn('[RAB Validator] 🧱 AI missed Wall Items! Injecting standard items...');
                uniqueItems.push(
                    { category: 'D. DINDING', name: 'Pasangan Dinding Bata Ringan / Hebel', unit: 'm2', volume: maxWallArea, unitPrice: 135000, isAutomated: true },
                    { category: 'D. DINDING', name: 'Plesteran Dinding (2 Sisi)', unit: 'm2', volume: maxWallArea * 2, unitPrice: 65000, isAutomated: true },
                    { category: 'D. DINDING', name: 'Acian Dinding (2 Sisi)', unit: 'm2', volume: maxWallArea * 2, unitPrice: 35000, isAutomated: true }
                );

                // Cat Dinding (2 sisi) if missing
                const hasCat = uniqueItems.some(i => i.name?.toLowerCase().includes('cat dinding'));
                if (!hasCat) {
                    uniqueItems.push({ category: 'G. PENGECATAN', name: 'Pengecatan Dinding Interior & Eksterior', unit: 'm2', volume: maxWallArea * 2, unitPrice: 25000, isAutomated: true });
                }
            }

            // B. Struktur (New Logic)
            // Check current structure volume
            const structureItems = uniqueItems.filter(i => i.category?.toUpperCase().includes('STRUKTUR'));
            const totalConcrete = structureItems
                .filter(i => i.name.toLowerCase().includes('beton') && (i.unit === 'm3' || i.unit === 'm³'))
                .reduce((acc, curr) => acc + (Number(String(curr.volume).replace(/[^0-9.]/g, '')) || 0), 0);

            const totalSteel = structureItems
                .filter(i => (i.name.toLowerCase().includes('besi') || i.name.toLowerCase().includes('penulangan')) && (i.unit === 'kg' || i.unit === 'btg'))
                .reduce((acc, curr) => acc + (Number(String(curr.volume).replace(/[^0-9.]/g, '')) || 0), 0);

            const totalStructureCost = structureItems.reduce((acc, curr) => {
                const p = Number(String(curr.unitPrice).replace(/[^0-9]/g, '')) || 0;
                const v = Number(String(curr.volume).replace(/[^0-9.]/g, '')) || 0;
                return acc + (p * v);
            }, 0);

            console.log('[RAB Validator] 🏗️ Current Structure: Concrete', totalConcrete, 'm3, Steel', totalSteel, 'kg', 'Cost:', totalStructureCost);

            // If structure seems missing or too small (e.g. < 5m3 concrete or < 100 Juta)
            // Estimation: 0.25 m3 concrete per m2 floor area.
            if (maxFloorArea > 20 && (totalConcrete < 5 || totalSteel < 100 || totalStructureCost < 100000000)) {
                console.warn('[RAB Validator] 🏗️ AI Structure too small! Injecting standard Structure items...');

                const estConcrete = Math.round(maxFloorArea * 0.25 * 100) / 100; // ~0.25 m3 per m2

                // Remove existing tiny items to avoid clutter
                // Actually, filtering them out is better.
                // For now, just add the "Borongan" items which covers it.

                uniqueItems.push({
                    category: 'C. STRUKTUR',
                    name: 'Pekerjaan Beton Bertulang (Sloof, Kolom, Balok, Plat) - K225',
                    unit: 'm3',
                    volume: estConcrete,
                    unitPrice: 4500000, // Harga jadi termasuk besi & bekisting
                    isAutomated: true
                });
            }

            // 6. FINAL PURGE (Remove Bedeng from wrong categories)
            return uniqueItems.filter(item => {
                const name = item.name?.toLowerCase() || '';
                const cat = item.category?.toUpperCase() || '';

                // If Item is "Bedeng/Kantor" but Category is NOT Persiapan -> REMOVE
                if ((name.includes('bedeng') || name.includes('kantor sementara') || name.includes('gudang')) && !cat.includes('PERSIAPAN') && !cat.includes('A.')) {
                    console.warn(`[RAB Validator] 🗑️ Purging misplaced item: ${item.name} from ${item.category}`);
                    return false;
                }
                return true;
            });

            return uniqueItems;
        };

        const validateAndCorrectPrices = (items: any[]) => {
            console.log('[RAB Validator] Starting price validation...');
            const PRICE_LIMITS: Record<string, number> = {
                'm2': 1000000,
                'm3': 20000000,
                'm': 500000,
                'bh': 50000000,
                'ls': 100000000
            };

            return items.map((item: any) => {
                let newItem = { ...item };

                // 1. Fix Names (Remove "1 m3 ", "1 m2 ", etc prefix)
                // 1. Fix Names (Remove "1 m3 ", "1 m2 ", etc prefix)
                if (newItem.name) {
                    newItem.name = newItem.name.replace(/^\d+\s*(m3|m2|m¹|m|bh|ls|unit|kg|ton|zak)\s+/i, '');
                    newItem.name = newItem.name.replace(/^pembuatan\s+\d+\s*(m3|m2|m|kg)\s+/i, 'Pembuatan ');
                    newItem.name = newItem.name.replace(/^pemasangan\s+\d+\s*(m3|m2|m|kg)\s+/i, 'Pemasangan ');
                }

                // 2. Validate Price
                // Robust Price Parsing: Remove "Rp", dots, commas (if used as thousand separator)
                let priceStr = String(newItem.unitPrice).replace(/[^0-9]/g, '');
                let price = Number(priceStr) || 0;

                // Verify if parsing resulted in too huge number (e.g. AI sent cents 20000.00 -> 2000000)
                // Hard to guess, but we trust the Limit check next.

                const unit = (newItem.unit || '').trim().toLowerCase();
                const limit = PRICE_LIMITS[unit] || 50000000;

                // Merged Safety Check: If price exceeds limit OR exceeds absolute 100M safety cap
                if (price > limit || price > 100000000) {
                    // EXCEPTION: Structure Lumpsum can be large (up to 500M)
                    const isStructureLumpsum = (newItem.category?.toUpperCase().includes('STRUKTUR') && newItem.unit?.toLowerCase().includes('ls'));
                    if (isStructureLumpsum && price < 500000000) {
                        // Allow legitimate large structure lumpsum
                    } else {
                        console.warn(`[RAB Validator] 💰 Price Anomaly detected: ${newItem.name} (${newItem.unit}) @ ${price}. Capping...`);

                        // Fallback prices
                        if (unit === 'm3') price = 1500000;
                        else if (unit === 'm2') price = 250000;
                        else if (unit === 'm') price = 100000;
                        else if (unit === 'bh' || unit === 'unit') price = 2500000;
                        else price = limit / 10;

                        newItem.unitPrice = price;
                    }
                }

                // 3. BLACKLIST PURIFIER (Hard Deletion of Hallucinations)
                // If "Kuda-kuda Kayu" appears (hallucination), Nuke it.
                if (newItem.name && newItem.name.toLowerCase().includes('kuda-kuda') && newItem.name.toLowerCase().includes('kayu')) {
                    if (newItem.unitPrice > 10000000) { // If expensive (500M error)
                        console.warn('[RAB Validator] ☢️ NUCLEAR PURGE: Deleted hallucinated Wood Roof (500M).');
                        return null; // Remove item
                    }
                }

                // 4. DUPLICATE STRUCTURE HEADER FIX
                // If item is generic "Pekerjaan Struktur" with very small volume/price, it might be a header ghost.
                if (newItem.name && newItem.category?.toUpperCase().includes('STRUKTUR') && newItem.name.toLowerCase().trim() === 'pekerjaan struktur') {
                    return null; // Delete generic header item that causes duplication
                }

                // 3. Special Volume Caps for Earthworks
                if ((newItem.name?.toLowerCase().includes('galian') || newItem.name?.toLowerCase().includes('urugan')) && newItem.volume > 500) {
                    const corrected = 200;
                    console.warn(`[RAB Validator] 🚜 CORRECTED Earthwork Volume: ${newItem.volume} m3 -> ${corrected} m3`);
                    newItem.volume = corrected;
                }

                const total = price * (Number(newItem.volume) || 0);

                // Aggressive Total Value Cap
                const isStructure = newItem.category?.toUpperCase().includes('STRUKTUR');
                const MAX_TOTAL = isStructure ? 2000000000 : 500000000; // 2 Milyar for Structure, 500 Juta for others

                if (total > MAX_TOTAL) {
                    console.warn(`[RAB Validator] 💰 Total Value Anomaly: ${newItem.name} = ${total}. Reducing...`);
                    // Force reduce unit price to fit the max total
                    newItem.unitPrice = Math.floor(MAX_TOTAL / (Number(newItem.volume) || 1));
                }

                return newItem;
            });
        };

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

        try {
            // Build parts array - support multimodal input (image + text)
            const parts: any[] = [];

            // If floor plan image is provided, add it first
            if (aiFloorPlanImage) {
                // Extract base64 data (remove data:image/xxx;base64, prefix)
                const base64Data = aiFloorPlanImage.split(',')[1] || aiFloorPlanImage;
                const mimeMatch = aiFloorPlanImage.match(/data:(image\/\w+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

                parts.push({
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                    }
                });
            }

            // Build the prompt text
            // Build the prompt text (NEW LOGIC - CHAIN OF THOUGHT)
            // Build the prompt text (PARAMETRIC LOGIC UPGRADE)
            // User requested: "Don't guess, calculate backwards from Area x Price/m2"
            const promptText = aiFloorPlanImage
                ? `Role: Expert Civil Engineer & Quantity Surveyor (Estimator) - INDONESIA.
                   Persona: "Teknis tapi Santai" (Field Engineer).

                   🚨 CORE ALGORITHM (PARAMETRIC ESTIMATION):
                   Do NOT guess random prices. Use this TOP-DOWN approach:

                   STEP 1: ANCHOR PRICE (LOGIC GATE 1)
                   1. Calc Building Area = Length x Width x Floors. Round up.
                   2. Determine Base Price 2025:
                      - Jakarta/Bekasi Standard = Rp 3.600.000 - Rp 3.800.000 / m2.
                      - Luxury = > Rp 5.000.000.
                   3. Calculate TARGET TOTAL = Area x Base Price. (e.g. 180m2 x 3.6jt = ~648 Juta).
                   
                   STEP 2: WEIGHTING DISTRIBUTION (LOGIC GATE 2)
                   Allocate the TARGET TOTAL into categories:
                   - II. STRUKTUR BETON (Crucial): ~35-38% (Avg: 38%) -> e.g. 245 Juta.
                   - III. DINDING: ~14.5% -> e.g. 95 Juta.
                   - IV. PLAFOND & ATAP: ~8-10% -> e.g. 55 Juta.
                   - V. LANTAI: ~13% -> e.g. 85 Juta.
                   - VI. KUSEN/PINTU: ~7%.
                   - VII. MEP: ~6%.
                   - VIII. FINISHING: ~5%.
                   - OTHERS/PREPARATION: ~9%.

                   STEP 3: APPLY MODIFIERS (CONSTRAINTS & USER OVERRIDES)
                   *CHECK USER PROMPT FIRST for overrides. If not specified, use DEFAULTS.*

                   [DINDING]
                   - User said "Bata Merah"? -> Use "Pasangan Dinding Bata Merah". (Expensive/Heavy).
                   - Default -> Use "Pasangan Dinding Bata Ringan (Hebel)". (Standard).

                   [STRUKTUR]
                   - User said "Pancang" or "Tanah Lunak"? -> Use "Pondasi Tiang Pancang/Mini Pile".
                   - Default -> Use "Pondasi Tapak / Footplate Beton Bertulang" (Tanah Keras/Standard).

                   [FASAD]
                   - User said "ACP" or "Aluminium"? -> Use "Pasang ACP Seven/Marks". (Add ~500k-800k/m2 to Finishing Budget).
                   - Default -> Use "Pengecatan Tembok Eksterior Weathershield".

                   [ATAP]
                   - User said "Dak Beton" or "Rooftop"? -> Use "Plat Dak Beton". (Add structure cost).
                   - Default -> Use "Rangka Baja Ringan + Atap Spandek/Genteng Metal".

                   STEP 4: GENERATE LINE ITEMS (MAJOR WORK PACKAGES ONLY)
                   **CRITICAL RULES (NEGATIVE PROMPTS):**
                   1. **NO RENOVATION ITEMS**: Strictly FORBID items like "Pembongkaran", "Bobokan", "Perbaikan", "Suntik/Grouting". This is a NEW project.
                   2. **NO INDUSTRIAL SPECS**: Do not use "Sump Pit", "Cutter Pump", or "Genset" unless requested. Use residential "Septictank Biofil".
                   3. **NO MISPLACEMENT**: "Galian" & "Urugan" belongs in "Tanah", NOT in "Elektrikal" or "Struktur".
                   4. **NO LOWBALL PRICES**: Do not use raw material prices. Use "INSTALLED PRICE" (Material + Labor).

                   **REFERENCE PRICING (USE THESE ANCHORS per m2/m3):**
                   - Structure (Beton Bertulang): IDR 3,500,000 - 4,000,000 per m3 OR IDR 1,200,000 per m2 floor area.
                   - Wall (Hebel Terpasang): IDR 185,000 - 220,000 per m2.
                   - Floor (Granit 60x60 Terpasang): IDR 425,000 - 480,000 per m2.
                   - Roof (Baja Ringan + Spandek): IDR 250,000 - 300,000 per m2.
                   - Ceiling (Gypsum): IDR 110,000 - 130,000 per m2.
                   - Paint (Cat Tembok): IDR 35,000 - 50,000 per m2.

                   STEP 5: CHECK SUM & DUPLICATION
                   - Ensure sum of all items EQUALS the Target Total from Step 1.
                   - **DO NOT create duplicate headers** (e.g. do not make "C. STRUKTUR" twice).
                   
                   FINAL CHECK INSTRUCTIONS (ANTI-HALLUCINATION):
                   1. SINGLE ENTRY RULE: You have already detailed the "Struktur" in the beginning. DO NOT add a summary "Struktur" or "Beton Bertulang" item at the end of the JSON list.
                   2. NO DUPLICATE CATEGORIES: Ensure "Category II" (Struktur) appears ONLY ONCE.
                   3. CONSISTENCY: If you break down structure into components (Pondasi, Sloof, Kolom), DO NOT add a separate "Lumpsum" item for the same work.

                   OUTPUT TASK:
                   Generate the JSON Array RAB based on this logic.
                   Format: { category, name, unit, volume, unitPrice }.

                   CRITICAL RULES:
                   1. Prices MUST be Jakarta 2024.
                   2. Categories: A. PERSIAPAN, B. TANAH, C. STRUKTUR, D. DINDING, E. LANTAI, F. PLAFOND, G. ATAP, H. PINTU & JENDELA, I. SANITAIR, J. MEKANIKAL, K. ELEKTRIKAL, L. FINISHING.
                   3. Volume Checks: Wall m3 < (Wall m2 * 0.15).
                   4. "Bedeng" max 24m2.
                   5. NO "1 m3" prefix.

                   Output strictly JSON (and if you want to explain, do it outside the JSON block).`

                : `Role: Expert Estimator.
                   Task: Create detailed RAB for "${aiPrompt}".
                   Logic:
                   1. Estimate Floor Area based on description.
                   2. Target Cost ~4jt/m2 (Standard).
                   3. Breakdown into: Structure (35%), Walls (20%), Finishing (45%).
                   Output JSON Array: { category, name, unit, volume, unitPrice }.
                   Categories: A. PERSIAPAN, B. TANAH, C. STRUKTUR, D. DINDING, etc.
                   Prices: Jakarta 2024.
                   Validation: Wall Volume m3 < Wall Area m2 * 0.2.
                   JSON Only.`;

            parts.push({ text: promptText });

            // Retry logic with exponential backoff AND KEY ROTATION
            const maxRetries = 3;
            let lastError: Error | null = null;

            // Dynamic import to allow using the helpers
            const { getApiKey, rotateToNextKey, getStoredApiKeys } = await import('../utils/aiScheduler');

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    // Get current key (fresh fetch)
                    const currentApiKey = await getApiKey();
                    if (!currentApiKey) throw new Error("API Key not found in Settings.");

                    if (attempt > 0) {
                        const delay = Math.pow(3, attempt) * 2000; // 6s, 18s, 54s (More aggressive backoff)
                        console.log(`[RAB Generator] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts }]
                        })
                    });

                    if (!response.ok) {
                        const errorBody = await response.text();
                        console.error(`[RAB Generator] API Error ${response.status}:`, errorBody);
                    }

                    if (response.status === 429) {
                        console.warn(`[RAB Generator] Rate limited (429) on key ...${currentApiKey.slice(-4)}`);

                        // ROTATION LOGIC
                        const allKeys = await getStoredApiKeys();
                        if (allKeys.length > 1) {
                            console.log(`[RAB Generator] 🔄 Rotating to next API key...`);
                            rotateToNextKey(allKeys.length);
                        } else {
                            console.warn(`[RAB Generator] Only 1 key available, cannot rotate. Waiting longer...`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        }

                        lastError = new Error("Rate limited");
                        continue; // Retry
                    }

                    if (response.status >= 500) {
                        console.warn(`[RAB Generator] Server error (${response.status}), will retry...`);
                        lastError = new Error(`Server error ${response.status}`);
                        continue; // Retry
                    }

                    if (!response.ok) {
                        throw new Error(`API Error: ${response.status}`);
                    }

                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (!text) {
                        throw new Error("Empty response from AI");
                    }

                    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

                    // Robust JSON Extraction (in case AI outputs "Thinking" text first)
                    const startIndex = cleanJson.indexOf('[');
                    const endIndex = cleanJson.lastIndexOf(']');

                    let jsonStr = cleanJson;
                    if (startIndex !== -1 && endIndex !== -1) {
                        jsonStr = cleanJson.substring(startIndex, endIndex + 1);
                    }

                    const items = JSON.parse(jsonStr);

                    if (!Array.isArray(items)) throw new Error("Invalid Format");

                    // 0. CATEGORY DEDUPLICATION FILTER (Fixes Triple Accounting)
                    // Logic: Once we see a major category (like STRUCTURE), we ban it from appearing again.
                    // This kills the "Summary at the end" ghost items.
                    const finalItems: any[] = [];
                    const seenCategories = new Set<string>();

                    // Priority Order isn't strictly needed if we just ban repeats.

                    for (const item of items) {
                        const catNameRaw = (item.category || '').toUpperCase().trim();
                        // Normalize category name (remove Roman Numerals I. II. C. etc)
                        // e.g. "C. PEKERJAAN STRUKTUR" -> "PEKERJAAN STRUKTUR"
                        const catKeyword = catNameRaw.replace(/^[A-Z0-9]+\.\s*/, '');

                        let isDuplicate = false;

                        // Check specific major categories for duplication
                        if (catKeyword.includes('STRUKTUR') || catKeyword.includes('BETON')) {
                            if (seenCategories.has('STRUKTUR')) {
                                console.log('💀 Killing Duplicate Structure Item (Triple Accounting Fix):', item.name);
                                isDuplicate = true;
                            } else {
                                seenCategories.add('STRUKTUR');
                            }
                        }

                        // You can extend this logic for other categories if needed

                        if (!isDuplicate) {
                            finalItems.push(item);
                        }
                    }

                    // Validate and correct unrealistic wall volumes before AHS integration
                    let validatedItems = validateAndCorrectVolumes(finalItems);

                    // Validate and correct unrealistic prices
                    validatedItems = validateAndCorrectPrices(validatedItems);

                    // AHS Integration DISABLED by User Request (2025-12-23)
                    // Let AI think for itself.
                    // let matchedItems = integrateWithAHS(validatedItems);
                    let matchedItems = validatedItems;

                    // Final Validation Pass: Purge anomalies (e.g. Bedeng in Dinding)
                    matchedItems = validateAndCorrectVolumes(matchedItems);

                    // Final Price Check (Safety Net)
                    matchedItems = validateAndCorrectPrices(matchedItems);

                    const newItems = matchedItems.map((i: any) => ({ ...i, id: Date.now() + Math.random(), progress: 0, isAddendum: false }));

                    if (activeProject) {
                        updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
                        // alert(`Berhasil generate RAB! Beberapa item otomatis terhubung ke AHS.`); 
                        alert(`Berhasil generate RAB secara Otomatis (AHS User-Disabled). Logic Murni.`);
                        setShowModal(false);
                    }
                    return; // Success, exit function

                } catch (innerError) {
                    lastError = innerError as Error;
                    if (attempt === maxRetries - 1) {
                        throw lastError;
                    }
                }
            }

            // If we get here, all retries failed
            if (lastError) throw lastError;

        } catch (e) {
            console.warn("Switching to offline generator:", e);
            runOffline();
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleImportRAB = async (importedItems: any[], importDate?: string) => {
        const date = importDate || new Date().toISOString().split('T')[0];
        const newLogs: any[] = [];
        const newItems = importedItems.map(item => {
            const newItemId = Date.now() + Math.random();
            const progress = Number(item.progress) || 0;

            if (progress > 0) {
                newLogs.push({
                    id: Date.now() + Math.random(),
                    date: date,
                    taskId: newItemId,
                    previousProgress: 0,
                    newProgress: progress,
                    note: 'Imported Progress'
                });
            }

            return {
                id: newItemId,
                category: item.category || 'Uncategorized',
                name: item.name || 'Unnamed Item',
                unit: item.unit || 'ls',
                volume: Number(item.volume) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                progress: progress,
                isAddendum: false
            };
        });

        if (!activeProject) {
            // Case: User imports from "New Project" menu but hasn't created one yet.
            // Action: Automatically create a new project with these items.
            if (!confirm(`Ditemukan ${newItems.length} item RAB. Buat proyek baru otomatis dengan data ini?`)) return;

            const newP: any = {
                // id: `new_${Date.now()}`, // REMOVE THIS: Let Firestore generate the ID!
                name: `Proyek Import ${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}`,
                client: 'Edit Klien',
                location: 'Lokasi Proyek',
                budgetLimit: 0,
                startDate: date, // Use import date as start date
                endDate: new Date((new Date(date)).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 3 months
                status: 'Berjalan',
                rabItems: newItems,
                transactions: [],
                workers: [],
                materials: [],
                materialLogs: [],
                tasks: [],
                attendanceLogs: [],
                attendanceEvidences: [],
                taskLogs: newLogs, // Include logs
                galleryItems: [],
                isDeleted: false,
                createdAt: new Date().toISOString()
            };

            try {
                await addDoc(collection(db, 'app_data', appId, 'projects'), newP);
                alert("Proyek baru berhasil dibuat dari Excel! Silakan edit detail proyeknya.");
                setShowModal(false);
            } catch (e) {
                console.error("Auto-create project failed:", e);
                alert("Gagal membuat proyek otomatis.");
            }
        } else {
            // Case: Adding items to existing project
            updateProject({
                rabItems: [...(activeProject.rabItems || []), ...newItems],
                taskLogs: [...(activeProject.taskLogs || []), ...newLogs]
            });
            alert(`Berhasil menambahkan ${newItems.length} item ke RAB proyek aktif!`);
            setShowModal(false);
        }
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
        if (type === 'newMaterial') {
            if (setSelectedMaterial) setSelectedMaterial(null);
        }
        if (type === 'newTransaction') {
            if (props.setTransactionDesc) props.setTransactionDesc('');
            if (props.setTransactionAmount) props.setTransactionAmount(0);
            if (props.setTransactionDate) props.setTransactionDate(new Date().toISOString().split('T')[0]);
            if (props.setTransactionProof) props.setTransactionProof(null);
        }
        setModalType(type);
        setShowModal(true);
    };

    // ========== Deleters & Helpers ==========
    const handleSoftDeleteProject = async (p: Project) => {
        if (!confirm(`Yakin ingin memindahkan proyek "${p.name}" ke Sampah?`)) return;
        try {
            // Try standard delete first (Assumes p.id is the document ID)
            await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: true });
        } catch (e) {
            console.warn("Direct delete failed (ID mismatch?), trying fallback query...", e);
            try {
                // Fallback: Query by the 'id' field potentially stored inside data
                const { query, where, getDocs } = await import('firebase/firestore');
                const colRef = collection(db, 'app_data', appId, 'projects');
                const q = query(colRef, where('id', '==', p.id));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const realDocRef = snap.docs[0].ref;
                    await updateDoc(realDocRef, { isDeleted: true });
                    console.log("Successfully deleted zombie project via fallback.");
                    return;
                }
            } catch (err2) {
                console.error("Fallback delete also failed:", err2);
            }
            alert("Gagal menghapus. ID proyek tidak ditemukan.");
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

    const handleSaveQC = async (checklist: { items: any[], photoUrl?: string }) => {
        if (!activeProject || !selectedRabItem) return;

        const newQCLog = {
            id: Date.now(),
            rabItemId: selectedRabItem.id,
            date: new Date().toISOString().split('T')[0],
            status: checklist.items.every((i: any) => i.isChecked) ? 'Passed' : 'Failed', // Simple logic
            inspector: user?.displayName || 'Pengawas',
            items: checklist.items,
            photoUrl: checklist.photoUrl,
            notes: checklist.items.filter((i: any) => !i.isChecked).length > 0 ? 'Beberapa item belum memenuhi standar.' : 'Semua item OK.'
        };

        const updatedQCLogs = [...(activeProject.qcLogs || []), newQCLog];
        // Cast to any because qcLogs is not yet in Project type in some contexts or if type update was missed
        await updateProject({ qcLogs: updatedQCLogs } as any);
        setShowModal(false);
        alert('Laporan QC Berhasil Disimpan!');
    };

    const handleSaveDefect = async (defect: any) => {
        if (!activeProject) return;
        const newDefect = {
            id: Date.now(),
            reportedDate: new Date().toISOString().split('T')[0],
            status: 'Open',
            reportedBy: user?.displayName || 'Owner',
            ...defect
        };
        const updatedDefects = [...(activeProject.defects || []), newDefect];
        await updateProject({ defects: updatedDefects } as any);
        setShowModal(false);
        alert('Defect berhasil dicatat!');
    };

    const handleUpdateDefectStatus = async (id: number, status: 'Fixed' | 'Verified') => {
        if (!activeProject) return;
        const updatedDefects = activeProject.defects?.map((d: any) =>
            d.id === id ? { ...d, status, [status === 'Fixed' ? 'fixedDate' : 'verifiedDate']: new Date().toISOString().split('T')[0] } : d
        );
        await updateProject({ defects: updatedDefects } as any);
    }

    // ========== Cash Advance (Kasbon) Handlers ==========
    const handleAddCashAdvance = async (workerId: number, amount: number, description: string) => {
        if (!activeProject) return;

        const worker = activeProject.workers.find(w => w.id === workerId);
        const workerName = worker?.name || 'Tukang';

        const newCashAdvance: CashAdvance = {
            id: Date.now(),
            workerId,
            date: new Date().toISOString().split('T')[0],
            amount,
            remainingAmount: amount,
            description: description || 'Kasbon',
            status: 'unpaid'
        };

        // Also create a transaction (expense) for the kasbon
        const kasbonTransaction: Transaction = {
            id: Date.now() + 1,
            date: new Date().toISOString().split('T')[0],
            category: 'Kasbon Tukang',
            description: `Kasbon: ${workerName} - ${description || 'Kasbon'}`,
            amount: amount,
            type: 'expense',
            workerId: workerId
        };

        const updatedCashAdvances = [newCashAdvance, ...(activeProject.cashAdvances || [])];
        const updatedTransactions = [kasbonTransaction, ...(activeProject.transactions || [])];

        await updateProject({
            cashAdvances: updatedCashAdvances,
            transactions: updatedTransactions
        });
    };

    const handlePayCashAdvance = async (cashAdvanceId: number, payAmount: number) => {
        if (!activeProject) return;

        const cashAdvances = activeProject.cashAdvances || [];
        const updatedCashAdvances = cashAdvances.map((ca: CashAdvance) => {
            if (ca.id === cashAdvanceId) {
                const newRemaining = Math.max(0, ca.remainingAmount - payAmount);
                let newStatus: CashAdvance['status'] = 'unpaid';

                if (newRemaining === 0) {
                    newStatus = 'paid';
                } else if (newRemaining < ca.amount) {
                    newStatus = 'partial';
                }

                return {
                    ...ca,
                    remainingAmount: newRemaining,
                    status: newStatus
                };
            }
            return ca;
        });

        await updateProject({ cashAdvances: updatedCashAdvances });
    };

    // ========== Equipment (Sewa Alat) Handlers ==========
    const handleAddEquipment = async (equipment: Omit<Equipment, 'id' | 'status'>) => {
        if (!activeProject) return;

        const newEquipment: Equipment = {
            ...equipment,
            id: Date.now(),
            status: 'active'
        };

        // Also create a transaction for the rental deposit (optional - based on settings)
        const updatedEquipment = [newEquipment, ...(activeProject.equipment || [])];
        await updateProject({ equipment: updatedEquipment });
    };

    const handleReturnEquipment = async (equipmentId: number) => {
        if (!activeProject) return;

        const equipment = activeProject.equipment || [];
        const updatedEquipment = equipment.map((eq: Equipment) => {
            if (eq.id === equipmentId) {
                return {
                    ...eq,
                    status: 'returned' as const,
                    returnDate: new Date().toISOString().split('T')[0]
                };
            }
            return eq;
        });

        await updateProject({ equipment: updatedEquipment });
    };

    // =============== SUBKON HANDLERS ===============

    const handleAddSubkon = async (subkonData: Omit<Subkon, 'id' | 'status' | 'payments' | 'progress'>) => {
        if (!activeProject) return;

        const subkons = activeProject.subkons || [];
        const newId = subkons.length > 0 ? Math.max(...subkons.map(s => s.id)) + 1 : 1;

        const newSubkon: Subkon = {
            ...subkonData,
            id: newId,
            status: 'active',
            progress: 0,
            payments: []
        };

        await updateProject({ subkons: [...subkons, newSubkon] });
    };

    const handleUpdateSubkon = async (subkonId: number, updates: Partial<Subkon>) => {
        if (!activeProject) return;

        const subkons = activeProject.subkons || [];
        const updatedSubkons = subkons.map(s =>
            s.id === subkonId ? { ...s, ...updates } : s
        );

        await updateProject({ subkons: updatedSubkons });
    };

    const handleAddSubkonPayment = async (subkonId: number, amount: number, note: string) => {
        if (!activeProject) return;

        const subkons = activeProject.subkons || [];
        const updatedSubkons = subkons.map(s => {
            if (s.id === subkonId) {
                const newPayments = [
                    ...s.payments,
                    { date: new Date().toISOString().split('T')[0], amount, note }
                ];
                return { ...s, payments: newPayments };
            }
            return s;
        });

        await updateProject({ subkons: updatedSubkons });
    };

    return {
        // QC & Defect
        handleSaveQC,
        handleSaveDefect,
        handleUpdateDefectStatus,
        // Project CRUD
        handleSaveProject,
        prepareEditProject,
        handleSoftDeleteProject,
        handleRestoreProject,
        handlePermanentDeleteProject,
        // RAB
        handleSaveRAB,
        deleteRABItem,
        handleUpdateProgress,
        prepareEditRABItem,
        // Worker/Payroll
        handleSaveWorker,
        handleEditWorker,
        handlePayWorker,
        handleDeleteWorker,
        handleSaveTransaction, // NEW
        // Material/Stock
        handleStockMovement,
        handleSaveMaterial,
        handleEditMaterial,
        handleDeleteMaterial,
        handleTransferMaterial,
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
        handleAutoSchedule,
        handleGenerateWeeklyReport,
        handleUpdateWeeklyReport,
        // Cash Advance (Kasbon)
        handleAddCashAdvance,
        handlePayCashAdvance,
        // Equipment (Sewa Alat)
        handleAddEquipment,
        handleReturnEquipment,
        // Subkon
        handleAddSubkon,
        handleUpdateSubkon,
        handleAddSubkonPayment,
    };
};

export default useProjectHandlers;
