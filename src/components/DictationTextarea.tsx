import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface DictationTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
}

export default function DictationTextarea({
  value,
  onChange,
  placeholder,
  rows = 2,
  className = '',
  id,
}: DictationTextareaProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const initialValueRef = useRef<string>('');
  
  // Use a ref to always point to the latest onChange callback
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (!recognitionRef.current) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'vi-VN';
  
          recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            
            // Append transcribed text to the value that was preset when listening started
            const currentSessionText = finalTranscript + interimTranscript;
            const separator = currentSessionText && initialValueRef.current && !initialValueRef.current.endsWith(' ') ? ' ' : '';
            onChangeRef.current(initialValueRef.current + separator + currentSessionText);
          };
  
          recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
          };
  
          recognitionRef.current.onend = () => {
            setIsListening(false);
          };
        }
      } else {
        setIsSupported(false);
      }
    }
  }, []); // Only run once on mount

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        initialValueRef.current = value; // Capture the value just before recording starts
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting recognition", err);
      }
    }
  };

  return (
    <div className="relative group">
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} pr-12`} // Add right padding to prevent text overlapping with button
      />
      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          className={`absolute top-2 right-2 p-1.5 rounded-lg border transition-colors ${
            isListening 
              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 animate-pulse outline-none ring-2 ring-red-500/20' 
              : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:text-indigo-400 cursor-pointer shadow-sm'
          }`}
          title={isListening ? "Nhấn để dừng ghi âm" : "Nhấn để nhập bằng giọng nói"}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
