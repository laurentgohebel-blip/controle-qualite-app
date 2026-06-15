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
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    let transcript = '';
    r.onresult = (e: any) => {
      transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      console.log('[voice] résultat partiel:', transcript);
    };
    r.onend = () => {
      console.log('[voice] onend, transcript final:', transcript);
      setListening(false);
      const txt = transcript.trim();
      if (txt) onResult(txt);
      else alert('Aucun son détecté. Essayez de parler plus fort, plus longtemps, et cliquez Stop seulement quand vous avez fini.');
    };
    r.onerror = (e: any) => {
      console.warn('[voice] erreur:', e.error);
      setListening(false);
      if (e.error === 'not-allowed') alert('Autorisez l\'accès au micro dans votre navigateur (icône cadenas à gauche de l\'URL).');
      else if (e.error === 'no-speech') alert('Aucun son détecté.');
      else if (e.error === 'audio-capture') alert('Micro indisponible (autre app l\'utilise ?).');
      else alert('Erreur dictée : ' + e.error);
    };
    r.onstart = () => console.log('[voice] start');
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
