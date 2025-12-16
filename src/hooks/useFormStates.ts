import { useState } from 'react';
import type { RABItem, Material, UserRole } from '../types';

/**
 * Central form state management hook
 * Contains all input states that are passed to ModalManager
 */
export const useFormStates = () => {
    // Project form
    const [inputName, setInputName] = useState('');
    const [inputClient, setInputClient] = useState('');
    const [inputLocation, setInputLocation] = useState('');
    const [inputOwnerPhone, setInputOwnerPhone] = useState('');
    const [inputBudget, setInputBudget] = useState(0);
    const [inputStartDate, setInputStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [inputEndDate, setInputEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [inputHeroImage, setInputHeroImage] = useState('');

    // RAB form
    const [rabCategory, setRabCategory] = useState('');
    const [rabItemName, setRabItemName] = useState('');
    const [rabUnit, setRabUnit] = useState('');
    const [rabVol, setRabVol] = useState(0);
    const [rabPrice, setRabPrice] = useState(0);
    const [selectedRabItem, setSelectedRabItem] = useState<RABItem | null>(null);
    const [selectedAhsId, setSelectedAhsId] = useState<string | null>(null);

    // Progress form
    const [progressInput, setProgressInput] = useState(0);
    const [progressDate, setProgressDate] = useState(new Date().toISOString().split('T')[0]);
    const [progressNote, setProgressNote] = useState('');

    // Payment form
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

    // Worker form
    const [inputWorkerRole, setInputWorkerRole] = useState('Tukang');
    const [inputWageUnit, setInputWageUnit] = useState('Harian');
    const [inputRealRate, setInputRealRate] = useState(0);
    const [inputMandorRate, setInputMandorRate] = useState(0);

    // Stock form
    const [stockType, setStockType] = useState<'in' | 'out'>('in');
    const [stockQty, setStockQty] = useState(0);
    const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
    const [stockNotes, setStockNotes] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

    // Material creation form
    const [inputMaterialName, setInputMaterialName] = useState('');
    const [inputMaterialUnit, setInputMaterialUnit] = useState('pcs');
    const [inputMinStock, setInputMinStock] = useState(10);
    const [inputInitialStock, setInputInitialStock] = useState(0);

    // User management form
    const [inputEmail, setInputEmail] = useState('');
    const [inputRole, setInputRole] = useState<UserRole>('pengawas');

    // AI/Generation form
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Attendance form
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<{ [key: number]: { status: string } }>({});
    const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
    const [evidenceLocation, setEvidenceLocation] = useState<string | null>(null);
    const [isGettingLoc, setIsGettingLoc] = useState(false);

    // Transaction form
    const [transactionDesc, setTransactionDesc] = useState('');
    const [transactionAmount, setTransactionAmount] = useState(0);
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
    const [transactionCategory, setTransactionCategory] = useState('');
    const [transactionProof, setTransactionProof] = useState<string | null>(null);

    // Reset functions
    const resetTransactionForm = () => {
        setTransactionDesc('');
        setTransactionAmount(0);
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setTransactionCategory('');
        setTransactionType('expense');
        setTransactionProof(null);
    };

    const resetProjectForm = () => {
        setInputName('');
        setInputClient('');
        setInputLocation('');
        setInputOwnerPhone('');
        setInputBudget(0);
        setInputStartDate(new Date().toISOString().split('T')[0]);
        setInputEndDate(new Date().toISOString().split('T')[0]);
        setInputHeroImage('');
    };

    const resetRABForm = () => {
        setRabCategory('');
        setRabItemName('');
        setRabUnit('');
        setRabVol(0);
        setRabPrice(0);
        setSelectedAhsId(null);
    };

    const resetWorkerForm = () => {
        setInputName('');
        setInputWorkerRole('Tukang');
        setInputWageUnit('Harian');
        setInputRealRate(0);
        setInputMandorRate(0);
    };

    const resetMaterialForm = () => {
        setInputMaterialName('');
        setInputMaterialUnit('pcs');
        setInputMinStock(10);
        setInputInitialStock(0);
    };

    const resetStockForm = () => {
        setStockQty(0);
        setStockNotes('');
    };

    return {
        // Project
        inputName, setInputName,
        inputClient, setInputClient,
        inputLocation, setInputLocation,
        inputOwnerPhone, setInputOwnerPhone,
        inputBudget, setInputBudget,
        inputStartDate, setInputStartDate,
        inputEndDate, setInputEndDate,
        inputHeroImage, setInputHeroImage,
        resetProjectForm,

        // RAB
        rabCategory, setRabCategory,
        rabItemName, setRabItemName,
        rabUnit, setRabUnit,
        rabVol, setRabVol,
        rabPrice, setRabPrice,
        selectedRabItem, setSelectedRabItem,
        selectedAhsId, setSelectedAhsId,
        resetRABForm,

        // Progress
        progressInput, setProgressInput,
        progressDate, setProgressDate,
        progressNote, setProgressNote,

        // Payment
        paymentAmount, setPaymentAmount,
        selectedWorkerId, setSelectedWorkerId,

        // Worker
        inputWorkerRole, setInputWorkerRole,
        inputWageUnit, setInputWageUnit,
        inputRealRate, setInputRealRate,
        inputMandorRate, setInputMandorRate,
        resetWorkerForm,

        // Stock
        stockType, setStockType,
        stockQty, setStockQty,
        stockDate, setStockDate,
        stockNotes, setStockNotes,
        selectedMaterial, setSelectedMaterial,
        resetStockForm,

        // Material
        inputMaterialName, setInputMaterialName,
        inputMaterialUnit, setInputMaterialUnit,
        inputMinStock, setInputMinStock,
        inputInitialStock, setInputInitialStock,
        resetMaterialForm,

        // User Management
        inputEmail, setInputEmail,
        inputRole, setInputRole,

        // AI
        aiPrompt, setAiPrompt,
        isGeneratingAI, setIsGeneratingAI,

        // Attendance
        attendanceDate, setAttendanceDate,
        attendanceData, setAttendanceData,
        evidencePhoto, setEvidencePhoto,
        evidenceLocation, setEvidenceLocation,
        isGettingLoc, setIsGettingLoc,

        // Transaction (New)
        transactionDesc, setTransactionDesc,
        transactionAmount, setTransactionAmount,
        transactionDate, setTransactionDate,
        transactionType, setTransactionType,
        transactionCategory, setTransactionCategory,
        transactionProof, setTransactionProof,
        resetTransactionForm,
    };
};

export type FormStates = ReturnType<typeof useFormStates>;

export default useFormStates;
