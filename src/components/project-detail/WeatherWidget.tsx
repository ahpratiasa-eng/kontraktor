import React from 'react';
import { type WeatherData, getWeatherIcon, getWeatherDesc, getCastSafetyStatus } from '../../hooks/useWeather';

interface WeatherWidgetProps {
    weather: WeatherData | null;
    loading?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, loading }) => {
    if (loading || !weather) {
        return <div className="text-white/80 text-xs">Memuat data cuaca...</div>;
    }

    return (
        <div className="flex flex-col">
            {/* Main Weather */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{getWeatherIcon(weather.code)}</span>
                <div className="flex flex-col text-white">
                    <span className="text-sm font-bold">{weather.temp}°C, {getWeatherDesc(weather.code)}</span>
                    <span className="text-[10px] opacity-80">{weather.city}</span>
                </div>
            </div>

            {/* Daily Forecast */}
            <div className="hidden md:flex gap-2">
                {[0, 1, 2].map(i => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dayName = i === 0 ? 'Hari Ini' : date.toLocaleDateString('id-ID', { weekday: 'short' });
                    const code = weather.daily.weather_code[i];
                    const prob = weather.daily.precipitation_probability_max[i];
                    const safety = getCastSafetyStatus(code, prob);

                    return (
                        <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl min-w-[80px] text-center shadow-lg transition hover:bg-white/20 hover:scale-105 transform duration-300">
                            <span className="text-[10px] font-bold text-white/80 mb-1">{dayName}</span>
                            <span className="text-xl mb-1 filter drop-shadow-md">{getWeatherIcon(code)}</span>
                            <span className="text-[10px] font-medium text-white">{Math.round(weather.daily.temperature_2m_max[i])}°C</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold mt-1 ${safety.bg} ${safety.color}`}>{safety.status}</span>
                        </div>
                    )
                })}
            </div>

            {/* Mobile Forecast */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2 border-t border-white/10 mt-2 w-full max-w-[200px]">
                {[0, 1, 2].map(i => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dayName = i === 0 ? 'Hari Ini' : date.toLocaleDateString('id-ID', { weekday: 'short' });
                    const code = weather.daily.weather_code[i];
                    const prob = weather.daily.precipitation_probability_max[i];
                    const safety = getCastSafetyStatus(code, prob);

                    return (
                        <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl min-w-[70px] text-center shrink-0">
                            <span className="text-[10px] font-bold text-white/80 mb-1">{dayName}</span>
                            <span className="text-lg mb-1">{getWeatherIcon(code)}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold mt-1 ${safety.bg} ${safety.color}`}>{safety.status}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default WeatherWidget;
