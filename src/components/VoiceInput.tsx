import { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceButton({ onResult, lang = 'fr-FR' }: { onResult: (text: string) => void; lang?: string }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const Rec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    setSupported(!!Rec);
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new Rec();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((res: any) => res[0].transcript).join(' ');
      if (text) onResult(text);
    };
    r.onend = () => setListening(false);
    r.onerror = (e: any) => {
      setListening(false);
      if (e.error === 'not-allowed') alert('Autorisez l\'accès au micro dans votre navigateur.');
    };
    recognitionRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition ${
        listening
          ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
      title="Dicter le commentaire"
    >
      {listening ? '⏹ Stop' : '🎤 Dicter'}
    </button>
  );
}
