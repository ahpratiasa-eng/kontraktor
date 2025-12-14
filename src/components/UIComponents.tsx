import React, { useState, useEffect } from 'react';
import { TrendingUp, Banknote, ChevronUp, ChevronDown } from 'lucide-react';
import { formatNumber, parseNumber, formatRupiah } from '../utils/helpers';

export const NumberInput = ({ value, onChange, placeholder, className }: { value: number, onChange: (val: number) => void, placeholder?: string, className?: string }) => {
  const [displayValue, setDisplayValue] = useState(formatNumber(value));

  useEffect(() => {
    if (parseNumber(displayValue) !== value) {
      setDisplayValue(value === 0 ? '' : formatNumber(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); 
    const numValue = Number(rawValue);
    setDisplayValue(formatNumber(rawValue));
    onChange(numValue);
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      inputMode="numeric" 
    />
  );
};

export const TransactionGroup = ({ group, isExpanded, onToggle }: any) => {
  return (
    <div className="bg-white rounded-xl border shadow-sm mb-2 overflow-hidden transition-all break-inside-avoid">
      <div onClick={onToggle} className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${group.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{group.type === 'income' ? <TrendingUp size={16} /> : <Banknote size={16} />}</div>
          <div><div className="font-bold text-sm text-slate-800">{group.category}</div><div className="text-xs text-slate-500 flex items-center gap-1">{group.date} • {group.items.length} Transaksi</div></div>
        </div>
        <div className="text-right"><div className={`font-bold ${group.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{group.type === 'expense' ? '-' : '+'} {formatRupiah(group.totalAmount)}</div>{isExpanded ? <ChevronUp size={16} className="ml-auto text-slate-400"/> : <ChevronDown size={16} className="ml-auto text-slate-400"/>}</div>
      </div>
      {isExpanded && (<div className="bg-slate-50 border-t border-slate-100">{group.items.map((t: any, idx: number) => (<div key={t.id} className={`p-3 flex justify-between items-center text-sm ${idx !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}><div className="flex-1"><span className="text-slate-700">{t.description}</span></div><div className="flex items-center gap-3"><span className="font-medium text-slate-600">{formatRupiah(t.amount)}</span></div></div>))}</div>)}
    </div>
  );
};
