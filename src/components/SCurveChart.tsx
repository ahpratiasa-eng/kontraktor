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
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 mb-2">
          <TrendingUp size={24} />
        </div>
        <div className="text-center text-xs font-bold text-slate-500">Belum ada data progres.</div>
        <div className="text-[10px] text-slate-400">Kurva S akan muncul saat Anda mengisi progres RAB.</div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-3xl border shadow-sm overflow-hidden ${compact ? 'p-4' : 'p-5 mb-6 break-inside-avoid'}`}>
      {!compact && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2"><TrendingUp size={20} className="text-blue-600" /> Kurva S</h3>
          <div className="flex gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Realisasi</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div> Rencana</span>
          </div>
        </div>
      )}
      <div className={`relative border-l border-b border-slate-200 ml-8 mr-2 ${compact ? 'h-32 mt-2' : 'h-64 mt-4'} bg-white`}>
        {/* Y Axis Labels */}
        <div className="absolute -left-0 top-0 text-[9px] font-bold text-slate-400 -translate-x-full pr-1">100%</div>
        <div className="absolute -left-0 top-1/2 text-[9px] font-bold text-slate-400 -translate-x-full pr-1 -translate-y-1/2">50%</div>
        <div className="absolute -left-0 bottom-0 text-[9px] font-bold text-slate-400 -translate-x-full pr-1">0%</div>

        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid Lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#f1f5f9" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" vectorEffect="non-scaling-stroke" />

          {/* Plan Line (Linear) */}
          <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6" vectorEffect="non-scaling-stroke" />

          {/* Realization Line - Gradient Area */}
          <defs>
            <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stats.prog >= stats.timeProgress ? "#22c55e" : "#ef4444"} stopOpacity="0.2" />
              <stop offset="100%" stopColor={stats.prog >= stats.timeProgress ? "#22c55e" : "#ef4444"} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* We need to construct a polygon for the area under the curve. This is tricky with just points string. 
                For now, we stick to the line but make it thicker/better style. */}

          <polyline
            fill="none"
            stroke={stats.prog >= stats.timeProgress ? "#22c55e" : "#ef4444"}
            strokeWidth="3"
            points={stats.curvePoints}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          <circle cx={stats.timeProgress} cy={100 - stats.prog} r="3" fill="white" stroke={stats.prog >= stats.timeProgress ? "#22c55e" : "#ef4444"} strokeWidth="2" vectorEffect="non-scaling-stroke" className="shadow-md" />
        </svg>

        {!compact && (
          <div className="absolute top-full left-0 w-full flex justify-between mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            {dateLabels.map((date, idx) => (
              <span key={idx} className={idx === 0 ? '-ml-2' : idx === dateLabels.length - 1 ? '-mr-2' : ''}>{date}</span>
            ))}
          </div>
        )}
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-4 text-xs mt-8 bg-slate-50 p-4 rounded-2xl">
          <div className="text-center">
            <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Plan (Waktu Berjalan)</span>
            <span className="text-xl font-black text-slate-700">{stats.timeProgress.toFixed(1)}%</span>
          </div>
          <div className="text-center">
            <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Real (Bobot Fisik)</span>
            <div className={`text-xl font-black ${stats.prog >= stats.timeProgress ? 'text-green-600' : 'text-red-500'}`}>
              {stats.prog.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SCurveChart;