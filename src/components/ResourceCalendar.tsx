import React, { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users, Wrench, Clock } from 'lucide-react';
import type { Project } from '../types';

interface ResourceCalendarProps {
    project: Project;
}

const ResourceCalendar: React.FC<ResourceCalendarProps> = ({ project }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Get days in current month
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay(); // 0 = Sunday

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month days
        for (let i = startOffset - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            days.push({ date: d, isCurrentMonth: false });
        }

        // Current month days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push({ date: new Date(year, month, d), isCurrentMonth: true });
        }

        // Next month days to fill grid
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
        }

        return days;
    }, [currentDate]);

    // Get resources for a specific date
    const getResourcesForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];

        // Workers from attendance logs
        const attendanceLogs = (project.attendanceLogs || []).filter(log =>
            log.date === dateStr && (log.status === 'Hadir' || log.status === 'Setengah' || log.status === 'Lembur')
        );
        const workerIds = attendanceLogs.map(log => log.workerId);
        const workers = (project.workers || []).filter(w => workerIds.includes(w.id));

        // Active equipment on this date
        const equipment = (project.equipment || []).filter(eq => {
            const rentStart = new Date(eq.rentDate);
            const rentEnd = eq.returnDate ? new Date(eq.returnDate) : new Date(eq.dueDate);
            return date >= rentStart && date <= rentEnd && eq.status !== 'returned';
        });

        // Active subkons
        const subkons = (project.subkons || []).filter(sk => {
            const start = new Date(sk.startDate);
            const end = new Date(sk.endDate);
            return date >= start && date <= end && sk.status === 'active';
        });

        return { workers, equipment, subkons };
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const selectedDateStr = selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={18} /> Kalender Resource
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="font-bold text-sm min-w-[140px] text-center">{monthName}</span>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Tukang</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Alat</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Subkon</div>
            </div>

            {/* Calendar Grid */}
            <div className="border rounded-xl overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-slate-100 text-xs font-bold text-slate-500">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                        <div key={day} className="p-2 text-center">{day}</div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                    {daysInMonth.map((dayInfo, idx) => {
                        const { workers, equipment, subkons } = getResourcesForDate(dayInfo.date);
                        const isToday = dayInfo.date.toDateString() === today.toDateString();
                        const isSelected = dayInfo.date.toDateString() === selectedDate.toDateString();
                        const hasResources = workers.length > 0 || equipment.length > 0 || subkons.length > 0;

                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedDate(dayInfo.date)}
                                className={`
                                    min-h-[60px] p-1 border-t border-r text-xs cursor-pointer transition-colors
                                    ${!dayInfo.isCurrentMonth ? 'bg-slate-50 text-slate-300' : 'hover:bg-slate-50'}
                                    ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset z-10' : ''}
                                `}
                            >
                                <div className={`font-bold mb-1 flex justify-between items-start`}>
                                    <span className={`${isToday ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : isSelected ? 'text-blue-600' : ''}`}>
                                        {dayInfo.date.getDate()}
                                    </span>
                                </div>

                                {dayInfo.isCurrentMonth && hasResources && (
                                    <div className="flex flex-wrap gap-0.5">
                                        {workers.length > 0 && (
                                            <span className="bg-blue-100 text-blue-700 px-1 rounded text-[9px] flex items-center gap-0.5">
                                                <Users size={8} /> {workers.length}
                                            </span>
                                        )}
                                        {equipment.length > 0 && (
                                            <span className="bg-orange-100 text-orange-700 px-1 rounded text-[9px] flex items-center gap-0.5">
                                                <Wrench size={8} /> {equipment.length}
                                            </span>
                                        )}
                                        {subkons.length > 0 && (
                                            <span className="bg-purple-100 text-purple-700 px-1 rounded text-[9px] flex items-center gap-0.5">
                                                <Clock size={8} /> {subkons.length}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Resources */}
            <div className="bg-slate-50 rounded-xl p-4 transition-all">
                <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center justify-between">
                    <span>Resource: {selectedDateStr}</span>
                    {selectedDate.toDateString() === today.toDateString() && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">Hari Ini</span>
                    )}
                </h4>
                {(() => {
                    const { workers, equipment, subkons } = getResourcesForDate(selectedDate);
                    if (workers.length === 0 && equipment.length === 0 && subkons.length === 0) {
                        return <p className="text-sm text-slate-400">Tidak ada resource terjadwal pada tanggal ini</p>;
                    }
                    return (
                        <div className="space-y-2">
                            {workers.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-blue-600 mb-1">👷 Tukang ({workers.length})</p>
                                    <div className="flex flex-wrap gap-1">
                                        {workers.map(w => (
                                            <span key={w.id} className="bg-white px-2 py-1 rounded border text-xs">{w.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {equipment.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-orange-600 mb-1">🔧 Alat ({equipment.length})</p>
                                    <div className="flex flex-wrap gap-1">
                                        {equipment.map(eq => (
                                            <span key={eq.id} className="bg-white px-2 py-1 rounded border text-xs">{eq.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {subkons.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-purple-600 mb-1">👥 Subkon ({subkons.length})</p>
                                    <div className="flex flex-wrap gap-1">
                                        {subkons.map(sk => (
                                            <span key={sk.id} className="bg-white px-2 py-1 rounded border text-xs">{sk.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default ResourceCalendar;
