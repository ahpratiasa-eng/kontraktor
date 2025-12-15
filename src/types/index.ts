export type UserRole = 'kontraktor' | 'keuangan' | 'pengawas' | 'super_admin' | 'client_guest';

export type AppUser = {
  email: string;
  role: UserRole;
  name: string;
};

export type RABItem = {
  id: number;
  category: string;
  name: string;
  unit: string;
  volume: number;
  unitPrice: number;
  progress: number;
  isAddendum: boolean;
  startDate?: string;
  endDate?: string;
  // Price locking fields
  priceLockedAt?: string;  // ISO timestamp when price was locked
  ahsItemId?: string;      // Reference to AHS item used (for update feature)
};

export type Transaction = {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  workerId?: number;
};

export type Material = { id: number; name: string; unit: string; stock: number; minStock: number; };

export type MaterialLog = {
  id: number;
  materialId: number;
  date: string;
  type: 'in' | 'out';
  quantity: number;
  notes: string;
  actor: string;
};

export type Worker = {
  id: number;
  name: string;
  role: 'Tukang' | 'Kenek' | 'Mandor';
  realRate: number;
  mandorRate: number;
  wageUnit: 'Harian' | 'Mingguan' | 'Bulanan';
};

export type Task = { id: number; name: string; weight: number; progress: number; lastUpdated: string; };
export type AttendanceLog = { id: number; date: string; workerId: number; status: 'Hadir' | 'Setengah' | 'Lembur' | 'Absen'; note: string; };

export type AttendanceEvidence = {
  id: number;
  date: string;
  photoUrl: string;
  location: string;
  uploader: string;
  timestamp: string;
};

export type GalleryItem = {
  id: number;
  url: string;
  caption: string;
  date: string;
  uploader: string;
  progress?: number;
};

export type TaskLog = { id: number; date: string; taskId: number; previousProgress: number; newProgress: number; note: string; };

export type Project = {
  id: string; name: string; client: string; location: string; ownerPhone?: string; status: string; budgetLimit: number;
  startDate: string; endDate: string;
  isDeleted?: boolean;
  transactions: Transaction[];
  materials: Material[];
  materialLogs: MaterialLog[];
  workers: Worker[];
  rabItems: RABItem[];
  tasks: Task[];
  attendanceLogs: AttendanceLog[];
  attendanceEvidences: AttendanceEvidence[];
  taskLogs: TaskLog[];
  gallery?: GalleryItem[];
};

export type GroupedTransaction = {
  id: string; date: string; category: string; type: 'expense' | 'income'; totalAmount: number; items: Transaction[];
};

export type PortfolioItem = {
  id: number;
  imageUrl: string;
  title: string;
  status: 'Selesai' | 'Sedang Berjalan';
  location: string;
};

export type LandingTheme = 'dark-orange' | 'light-blue' | 'dark-green' | 'light-elegant';

export type LandingPageConfig = {
  companyName: string;
  tagline: string;
  subtitle: string;
  whatsappNumber: string;
  instagramHandle: string;
  portfolioItems: PortfolioItem[];
  theme?: LandingTheme;
};

// ========== AHS (ANALISA HARGA SATUAN) ==========

export type AHSComponentType = 'bahan' | 'upah' | 'alat';

export type AHSComponent = {
  id: number;
  type: AHSComponentType;
  name: string;           // Nama komponen (e.g., "Semen PC 50kg")
  unit: string;           // Satuan (kg, m³, OH)
  coefficient: number;    // Koefisien per satuan pekerjaan
  unitPrice: number;      // Harga satuan komponen
  // Total = coefficient * unitPrice (calculated)
};

export type AHSItem = {
  id: string;
  code: string;           // Kode item (e.g., "A.1.1")
  category: string;       // Kategori (e.g., "Pekerjaan Persiapan")
  name: string;           // Nama pekerjaan (e.g., "Pas. 1m² Dinding Bata")
  unit: string;           // Satuan pekerjaan (m², m³, unit)
  components: AHSComponent[];
  isCustom: boolean;      // true if user-created, false if from SNI
  createdAt: string;
  updatedAt: string;
};

export type PricingResource = {
  id: string;
  name: string;
  unit: string;
  price: number;
  type: AHSComponentType;
  category: string;
  source: string; // e.g. "AHSP 2024", "Toko Bangunan A"
};

// Helper: Calculate total price dari AHS Item
export const calculateAHSTotal = (item: AHSItem): number => {
  return Math.round(item.components.reduce((sum, comp) => sum + (comp.coefficient * comp.unitPrice), 0));
};

// Helper: Calculate subtotal per type
export const calculateAHSSubtotal = (item: AHSItem, type: AHSComponentType): number => {
  return item.components
    .filter(comp => comp.type === type)
    .reduce((sum, comp) => sum + (comp.coefficient * comp.unitPrice), 0);
};