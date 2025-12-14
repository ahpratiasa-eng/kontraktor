export type UserRole = 'kontraktor' | 'keuangan' | 'pengawas' | 'super_admin';

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

export type TaskLog = { id: number; date: string; taskId: number; previousProgress: number; newProgress: number; note: string; };

export type Project = {
  id: string; name: string; client: string; location: string; status: string; budgetLimit: number;
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
};

export type GroupedTransaction = {
  id: string; date: string; category: string; type: 'expense' | 'income'; totalAmount: number; items: Transaction[];
};