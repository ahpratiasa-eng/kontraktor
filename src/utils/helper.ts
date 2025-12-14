import type { Project, Transaction, GroupedTransaction } from '../types';

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
  const groups: {[key: string]: GroupedTransaction} = {};
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
    if (planProgress > (realProgress + 5) && p.status !== 'Selesai') issues.push('Terlambat');
    if (now > end && realProgress < 100 && p.status !== 'Selesai') issues.push('Overdue');
    if ((inc - exp) < 0) issues.push('Boncos');

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
    const taskProgressState: {[taskId: number]: number} = {};
    (p.rabItems || []).forEach(t => taskProgressState[t.id] = 0);
    
    uniqueDates.forEach(dateStr => {
      const dateVal = new Date(dateStr).getTime();
      const logsUntilNow = (p.taskLogs || []).filter(l => new Date(l.date).getTime() <= dateVal);
      logsUntilNow.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(log => { taskProgressState[log.taskId] = log.newProgress; });
      
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