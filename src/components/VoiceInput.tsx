import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ value, onChange, placeholder, className, rows = 3 }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID'; // Bahasa Indonesia

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }

            if (finalTranscript) {
                // Determine if we should add a space or not
                const newText = value ? (value.trim() + ' ' + finalTranscript.trim()) : finalTranscript.trim();
                onChange(newText);
            }
        };

        recognitionRef.current = recognition;
    }, [value, onChange]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    return (
        <div className="relative">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full p-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
                rows={rows}
            />
            {isSupported && (
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${isListening
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                        }`}
                    title={isListening ? "Stop Dikte" : "Mulai Dikte Suara"}
                >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
            )}
            {!isSupported && (
                <div className="absolute right-2 top-2 text-slate-300" title="Browser tidak support voice">
                    <MicOff size={20} />
                </div>
            )}
            {isListening && (
                <div className="absolute right-12 top-2 text-xs text-red-500 font-bold animate-pulse pt-2">
                    Merekam...
                </div>
            )}
        </div>
    );
};

export default VoiceInput;
