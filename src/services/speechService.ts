/**
 * W3C Web Speech API Engine
 * Provides authentic, native browser Speech-to-Text (SpeechRecognition)
 * and Text-to-Speech (SpeechSynthesis) for hands-free field inspections,
 * voice note dictation, and audible statutory order readout.
 */

// Global type declarations for webkit prefixed SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface SpeechCapabilities {
  recognitionSupported: boolean;
  synthesisSupported: boolean;
  voicesCount: number;
  browserEngine: string;
}

let activeRecognition: any = null;
let isDictating = false;

/**
 * Returns current browser capabilities for W3C Speech APIs
 */
export function getSpeechCapabilities(): SpeechCapabilities {
  const recognitionSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const synthesisSupported =
    typeof window !== 'undefined' && Boolean(window.speechSynthesis);

  let voicesCount = 0;
  if (synthesisSupported && window.speechSynthesis.getVoices) {
    voicesCount = window.speechSynthesis.getVoices().length;
  }

  return {
    recognitionSupported,
    synthesisSupported,
    voicesCount,
    browserEngine: navigator.userAgent.includes('Chrome')
      ? 'Chromium / Blink'
      : navigator.userAgent.includes('Firefox')
      ? 'Gecko / Firefox'
      : navigator.userAgent.includes('Safari')
      ? 'WebKit'
      : 'Standard Web Platform',
  };
}

/**
 * Starts continuous voice dictation with real-time text transcription
 */
export function startVoiceDictation(options: {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  onStateChange?: (recording: boolean) => void;
  lang?: string; // 'en-IN' | 'hi-IN' | 'en-US'
}): boolean {
  if (typeof window === 'undefined') return false;

  const SpeechRecognitionConstructor =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionConstructor) {
    options.onError?.('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return false;
  }

  // Stop any ongoing recognition session
  stopVoiceDictation();

  try {
    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang || 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isDictating = true;
      options.onStateChange?.(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (finalTranscript) {
        options.onTranscript(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        options.onTranscript(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Ignorable silence event
        return;
      }
      console.warn('Speech recognition notice:', event.error);
      options.onError?.(
        event.error === 'not-allowed'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : `Speech recognition: ${event.error}`
      );
      isDictating = false;
      options.onStateChange?.(false);
    };

    recognition.onend = () => {
      isDictating = false;
      options.onStateChange?.(false);
    };

    activeRecognition = recognition;
    recognition.start();
    return true;
  } catch (err: any) {
    console.error('Failed to initialize speech recognition:', err);
    options.onError?.(err.message || 'Could not start microphone dictation.');
    return false;
  }
}

/**
 * Stops active voice dictation
 */
export function stopVoiceDictation(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {
      // ignore
    }
    activeRecognition = null;
  }
  isDictating = false;
}

export function isVoiceDictatingActive(): boolean {
  return isDictating;
}

/**
 * High-quality Text-to-Speech audio readout
 */
export function speakText(
  text: string,
  options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
  }
): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }

  // Cancel any currently speaking audio
  window.speechSynthesis.cancel();

  const cleanText = text.replace(/[*#_`]/g, '').trim();
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = options?.lang || 'en-IN';
  utterance.rate = options?.rate ?? 0.95; // comfortable cadence
  utterance.pitch = options?.pitch ?? 1.0;

  // Pick suitable voice if available
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(
    (v) =>
      v.lang === 'en-IN' ||
      v.name.includes('India') ||
      v.name.includes('Hindi') ||
      v.lang === 'hi-IN'
  );
  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stops any active speech playback
 */
export function stopSpeechSynthesis(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
