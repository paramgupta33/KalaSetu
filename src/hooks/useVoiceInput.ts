import { useState, useRef, useCallback } from 'react';
import { transcribeAudioBlob } from '../services/aiService';
import { Language } from '../types';

export interface UseVoiceInputOptions {
  language?: Language;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
}

/**
 * Centralized Voice Input Hook
 * - Captures real microphone audio via MediaRecorder
 * - Sends recording to Gemini 3.5 Transcribe (/api/ai/transcribe)
 * - Restricts speech recognition to English ('en') and Hindi ('hi')
 * - Strictly avoids browser SpeechRecognition and simulated speech
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { language = 'en', onTranscript, onError } = options;

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop and clean up all audio tracks
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Discard recorded chunks
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    setIsRecording(false);
    setIsTranscribing(false);
  }, [cleanupStream]);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];

    // Verify browser mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = 'Audio recording is not supported in this browser.';
      setError(err);
      onError?.(err);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,

        },
      });
      streamRef.current = stream;

      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        cleanupStream();
        setIsRecording(false);

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          const err = 'No audio was captured. Please hold the microphone button while speaking and try again.';
          setError(err);
          onError?.(err);
          return;
        }
        console.log("[Voice] chunks:", chunks.length);
        console.log("[Voice] audio size:", chunks.reduce((sum, chunk) => sum + chunk.size, 0));
        console.log("[Voice] mime:", mimeType);

        const audioBlob = new Blob(chunks, { type: mimeType });

        console.log("[Voice] final blob:", {
          size: audioBlob.size,
          type: audioBlob.type,
        });
        setIsTranscribing(true);

        try {
          // Support natural speech in any language supported by the system
          const transcribeLang = language || 'en';

          const response = await transcribeAudioBlob(audioBlob, transcribeLang);

          if (response.success && response.text && response.text.trim().length > 0) {
            setError(null);
            onTranscript?.(response.text.trim());
          } else {
            const errMsg = response.error || 'No audible speech was recognized. Please speak clearly into your microphone and try again.';
            setError(errMsg);
            onError?.(errMsg);
          }
        } catch (err: any) {
          const errMsg = err?.message || 'Failed to transcribe audio. Please check connection and try again.';
          setError(errMsg);
          onError?.(errMsg);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250); // Slice data every 250ms
      setIsRecording(true);
    } catch (err: any) {
      cleanupStream();
      setIsRecording(false);
      const errMsg =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied.'
          : 'Could not access microphone.';
      setError(errMsg);
      onError?.(errMsg);
    }
  }, [cleanupStream, language, onError, onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
