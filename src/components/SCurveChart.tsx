import { TrendingUp } from 'lucide-react';
import type { Project } from '../types';

const SCurveChart = ({ stats, project, compact = false }: { stats: any, project: Project, compact?: boolean }) => {
  const getAxisDates = () => {
    if (!project.startDate || !project.endDate) return [];
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const points = [0, 0.25, 0.5, 0.75, 1];
    return points.map(p => {
      const d = new Date(start.getTime() + (diffDays * p * 24 * 60 * 60 * 1000));
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    });
  };

  const dateLabels = getAxisDates();

  if (!stats.curvePoints || stats.curvePoints.includes('NaN')) {
    return <div className="text-center text-xs text-slate-400 py-10 bg-slate-50 rounded">Belum ada data.</div>;
  }

  return (
    <div className={`w-full bg-white rounded-xl border shadow-sm ${compact ? 'p-3' : 'p-4 mb-4 break-inside-avoid'}`}>
      {!compact && <h3 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={16}/> Kurva S (Bobot Biaya)</h3>}
      <div className={`relative border-l border-b border-slate-300 mx-2 ${compact ? 'h-24 mt-2' : 'h-48 mt-4'} bg-slate-50`}>
         <div className="absolute -left-6 top-0 text-[8px] text-slate-400">100%</div> 
         <div className="absolute -left-4 bottom-0 text-[8px] text-slate-400">0%</div>
         
         <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" vectorEffect="non-scaling-stroke"/>
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" vectorEffect="non-scaling-stroke"/>
            <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" vectorEffect="non-scaling-stroke"/>
            
            {/* Plan Line (Linear) */}
            <line x1="0" y1="100" x2="100" y2="0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4" vectorEffect="non-scaling-stroke"/>
            
            {/* Realization Line */}
            <polyline 
              fill="none" 
              stroke={stats.prog >= stats.timeProgress ? "#22c55e" : "#ef4444"} 
              strokeWidth="2" 
              points={stats.curvePoints} 
              vectorEffect="non-scaling-stroke" 
              strokeLinecap="round"
            />
            
            <circle cx={stats.timeProgress} cy={100 - stats.prog} r="1.5" fill="white" stroke="black" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
         </svg>
         
         {!compact && (
             <div className="absolute top-full left-0 w-full flex justify-between mt-1 text-[9px] text-slate-500 font-medium">
                {dateLabels.map((date, idx) => (
                  <span key={idx} className={idx === 0 ? '-ml-2' : idx === dateLabels.length - 1 ? '-mr-2' : ''}>{date}</span>
                ))}
             </div>
         )}
      </div>
      
      {!compact && (
          <div className="grid grid-cols-2 gap-2 text-xs mt-6">
             <div className="p-1.5 bg-slate-100 rounded text-center"><span className="block text-slate-500 text-[10px]">Plan (Waktu)</span><span className="font-bold">{stats.timeProgress.toFixed(1)}%</span></div>
             <div className={`p-1.5 rounded text-center ${stats.prog >= stats.timeProgress ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}><span className="block opacity-80 text-[10px]">Real (Bobot)</span><span className="font-bold">{stats.prog.toFixed(1)}%</span></div>
          </div>
      )}
    </div>
  );
};

export default SCurveChart;