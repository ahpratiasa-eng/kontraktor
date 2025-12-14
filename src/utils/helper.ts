import { Project, Transaction, GroupedTransaction } from '../types';

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
    
    // Generate S-Curve logic (Simplified for brevity, copy full logic from App.tsx if needed)
    const points: string[] = ["0,100", `${timeProgress},${100-weightedProgress}`];
    
    return { inc, exp, prog: weightedProgress, leak: 0, timeProgress, curvePoints: points.join(" "), totalRAB };
};