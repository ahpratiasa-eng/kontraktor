import type { Project, Transaction, GroupedTransaction, AttendanceLog, RABItem } from '../types';

export const formatNumber = (num: number | string) => {
  if (!num) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseNumber = (str: string) => {
  return Number(str.replace(/\./g, '').replace(/,/g, ''));
};

export const formatRupiah = (num: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

export const getGroupedTransactions = (transactions: Transaction[]): GroupedTransaction[] => {
  const groups: { [key: string]: GroupedTransaction } = {};
  transactions.forEach(t => {
    const key = `${t.date}-${t.category}-${t.type}`;
    if (!groups[key]) {
      groups[key] = {
        id: key,
        date: t.date,
        category: t.category,
        type: t.type,
        totalAmount: 0,
        items: []
      };
    }
    groups[key].totalAmount += t.amount;
    groups[key].items.push(t);
  });
  return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const calculateProjectHealth = (p: Project) => {
  const totalRAB = (p.rabItems || []).reduce((acc, item) => acc + (item.volume * item.unitPrice), 0);
  let realProgress = 0;
  if (totalRAB > 0) {
    (p.rabItems || []).forEach(item => {
      const w = ((item.volume * item.unitPrice) / totalRAB) * 100;
      realProgress += (item.progress * w) / 100;
    });
  }

  const start = new Date(p.startDate).getTime();
  const end = new Date(p.endDate).getTime();
  const now = new Date().getTime();
  const totalDuration = end - start;

  let planProgress = totalDuration > 0 ? Math.min(100, Math.max(0, ((now - start) / totalDuration) * 100)) : 0;

  const inc = (p.transactions || []).filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const exp = (p.transactions || []).filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

  const issues: string[] = [];
  if (planProgress > (realProgress + 10) && p.status !== 'Selesai') issues.push('Terlambat');
  if (now > end && realProgress < 100 && p.status !== 'Selesai') issues.push('Overdue');
  if (exp > inc) issues.push('Boncos');

  return { realProgress, planProgress, issues, isCritical: issues.length > 0 };
};

export const getStats = (p: Project) => {
  const tx = p.transactions || [];
  const inc = tx.filter(t => t.type === 'income').reduce((a, b) => a + (b.amount || 0), 0);
  const exp = tx.filter(t => t.type === 'expense').reduce((a, b) => a + (b.amount || 0), 0);

  const totalRAB = (p.rabItems || []).reduce((acc, item) => acc + (item.volume * item.unitPrice), 0);
  let weightedProgress = 0;
  if (totalRAB > 0) {
    (p.rabItems || []).forEach(item => {
      const itemTotal = item.volume * item.unitPrice;
      const itemWeight = (itemTotal / totalRAB) * 100;
      weightedProgress += (item.progress * itemWeight) / 100;
    });
  }

  const start = new Date(p.startDate).getTime();
  const end = new Date(p.endDate).getTime();
  const now = new Date().getTime();
  const totalDuration = end - start;
  let timeProgress = totalDuration > 0 ? Math.min(100, Math.max(0, ((now - start) / totalDuration) * 100)) : 0;

  const uniqueDates = Array.from(new Set((p.taskLogs || []).map(l => l.date))).sort();
  if (!uniqueDates.includes(p.startDate.split('T')[0])) uniqueDates.unshift(p.startDate.split('T')[0]);
  const today = new Date().toISOString().split('T')[0];
  if (!uniqueDates.includes(today)) uniqueDates.push(today);

  const points: string[] = [];
  const taskProgressState: { [taskId: number]: number } = {};
  (p.rabItems || []).forEach(t => taskProgressState[t.id] = 0);

  uniqueDates.forEach(dateStr => {
    const dateVal = new Date(dateStr).getTime();
    const logsUntilNow = (p.taskLogs || []).filter(l => new Date(l.date).getTime() <= dateVal);
    logsUntilNow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(log => { taskProgressState[log.taskId] = log.newProgress; });

    let totalProg = 0;
    if (totalRAB > 0) {
      (p.rabItems || []).forEach(item => {
        const currentProg = taskProgressState[item.id] || 0;
        const itemTotal = item.volume * item.unitPrice;
        const itemWeight = (itemTotal / totalRAB) * 100;
        totalProg += (currentProg * itemWeight) / 100;
      });
    }

    let x = ((dateVal - start) / totalDuration) * 100;
    x = Math.max(0, Math.min(100, x));
    let y = 100 - totalProg;
    points.push(`${x},${y}`);
  });

  return { inc, exp, prog: weightedProgress, leak: 0, timeProgress, curvePoints: points.join(" "), totalRAB };
};

export const getRABGroups = (project: Project) => {
  if (!project || !project.rabItems) return {};
  const groups: { [key: string]: RABItem[] } = {};
  project.rabItems.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });
  return groups;
};

export const calculateTotalDays = (logs: AttendanceLog[], workerId: number) => {
  if (!logs) return 0;
  return logs.filter(l => l.workerId === workerId).reduce((acc, curr) => {
    if (curr.status === 'Hadir') return acc + 1;
    if (curr.status === 'Setengah') return acc + 0.5;
    if (curr.status === 'Lembur') return acc + 1.5;
    return acc;
  }, 0);
};

export const calculateWorkerFinancials = (p: Project, workerId: number) => {
  const worker = p.workers.find(w => w.id === workerId);
  if (!worker) return { totalDue: 0, totalPaid: 0, balance: 0 };

  const days = calculateTotalDays(p.attendanceLogs, workerId);
  let dailyRate = worker.mandorRate;

  if (worker.wageUnit === 'Mingguan') dailyRate = worker.mandorRate / 7;
  if (worker.wageUnit === 'Bulanan') dailyRate = worker.mandorRate / 30;

  const totalDue = days * dailyRate;
  const totalPaid = (p.transactions || [])
    .filter(t => t.workerId === workerId && t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return { totalDue, totalPaid, balance: totalDue - totalPaid };
};