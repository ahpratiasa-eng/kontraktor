import { useState, useEffect } from 'react';

export interface WeatherData {
    temp: number;
    humidity: number;
    wind: number;
    code: number;
    city: string;
    daily: {
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
    };
}

export const useWeather = (location?: string) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        if (!location) return;

        const fetchWeather = async () => {
            setLoading(true);
            try {
                // 1. Geocoding
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=id&format=json`);
                const geoData = await geoRes.json();

                if (!geoData.results?.[0]) {
                    setLoading(false);
                    return;
                }

                const { latitude, longitude, name } = geoData.results[0];

                // 2. Forecast
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
                const weatherData = await weatherRes.json();

                setWeather({
                    temp: weatherData.current.temperature_2m,
                    humidity: weatherData.current.relative_humidity_2m,
                    wind: weatherData.current.wind_speed_10m,
                    code: weatherData.current.weather_code,
                    city: name,
                    daily: weatherData.daily
                });
            } catch (e) {
                console.error("Weather error", e);
                setError(e);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [location]);

    return { weather, loading, error };
};

// Helper utilities for UI
export const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code >= 80) return '⛈️';
    return '☁️';
};

export const getWeatherDesc = (code: number) => {
    if (code === 0) return 'Cerah';
    if (code <= 3) return 'Berawan';
    if (code <= 48) return 'Berkabut';
    if (code <= 67) return 'Hujan Ringan';
    if (code >= 80) return 'Hujan Lebat';
    return 'Mendung';
};

export const getCastSafetyStatus = (code: number, precipProb: number) => {
    // Aman jika tidak hujan (code < 50) dan probabilitas hujan < 40%
    if (code < 50 && precipProb < 40) return { status: 'Aman', color: 'text-green-500', bg: 'bg-green-100' };
    if (code < 60 && precipProb < 70) return { status: 'Waspada', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'Tunda Cor', color: 'text-red-500', bg: 'bg-red-100' };
};
