import React from 'react';
import type { Project } from '../../types';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { transformGDriveUrl } from '../../utils/storageHelper';
import WeatherWidget from './WeatherWidget';
import { useWeather } from '../../hooks/useWeather';

interface ProjectHeaderProps {
    project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
    const { weather, loading } = useWeather(project.location);

    const weekNumber = Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7));

    return (
        <div className="relative min-h-[340px] rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 mb-6 group transition-all duration-500 hover:shadow-blue-900/30">
            {/* Hero Image with Zoom Effect */}
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={project.heroImage ? transformGDriveUrl(project.heroImage) : "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1000&q=80"}
                    alt="Project Hero"
                    className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105"
                />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 flex flex-col justify-end p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="w-full md:w-auto">
                        <span className="inline-flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full w-fit font-bold mb-3 shadow-lg shadow-green-500/30 border border-green-400/50">
                            <Sparkles size={10} /> On Schedule
                        </span>

                        <div className="flex items-center gap-1.5 text-white/80 text-xs mb-2 font-medium tracking-wide">
                            <AlertTriangle size={12} className="text-yellow-400" /> {project.location?.toUpperCase() || 'LOKASI BELUM DISET'}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3 max-w-2xl drop-shadow-lg tracking-tight">
                            {project.name}
                        </h2>

                        <div className="flex items-center gap-4 text-white text-xs font-medium mb-2 glass-panel-sm p-2 rounded-lg bg-white/5 border border-white/10 w-fit backdrop-blur-md">
                            <div className="px-2">Minggu ke-<span className="text-lg font-bold ml-1 text-blue-300">{weekNumber > 0 ? weekNumber : 0}</span></div>
                            <div className="w-px h-6 bg-white/20"></div>
                            <div className="px-2">{project.client || 'Tanpa Nama Klien'}</div>
                        </div>
                    </div>

                    {/* Weather Widget */}
                    <div className="w-full md:w-auto flex justify-end">
                        <WeatherWidget weather={weather} loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectHeader;
