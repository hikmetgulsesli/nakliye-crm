import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import api from '@/config/api';

interface VoiceNoteCaptureProps {
  customerId: number;
  /** Aktivite olusturulunca parent yenilesin */
  onCreated?: () => void;
}

type State = 'idle' | 'recording' | 'uploading' | 'success' | 'error';

/**
 * Mic ile ses kaydı → base64 → /ai/voice-to-activity → otomatik Activity.
 * MediaRecorder kullanıyor; tarayıcı izin isterse kullanıcı onaylar.
 */
export function VoiceNoteCapture({ customerId, onCreated }: VoiceNoteCaptureProps) {
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    setTranscript(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Tarayıcı mikrofona erişimi desteklemiyor.');
        setState('error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = handleStop;
      recorderRef.current = mr;
      mr.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      tickRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
      setState('recording');
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Mikrofon erişimi reddedildi.');
      setState('error');
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  async function handleStop() {
    setState('uploading');
    const stream = recorderRef.current?.stream;
    stream?.getTracks().forEach((t) => t.stop());

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const audioBase64 = (reader.result as string) ?? '';
        const { data } = await api.post('/ai/voice-to-activity', {
          customerId,
          filename: 'note.webm',
          language: 'tr',
          audioBase64,
        });
        setTranscript(data?.transcript ?? '');
        setState('success');
        onCreated?.();
      } catch (err) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setError(
          e.response?.data?.message ??
            e.message ??
            'Yükleme başarısız. OpenAI API anahtarı yapılandırılmış mı?',
        );
        setState('error');
      }
    };
    reader.readAsDataURL(blob);
  }

  function reset() {
    setState('idle');
    setTranscript(null);
    setError(null);
    setElapsed(0);
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="rounded-2xl border border-token-border bg-token-bg-panel p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={
            state === 'idle' || state === 'success' || state === 'error'
              ? startRecording
              : state === 'recording'
                ? stopRecording
                : undefined
          }
          disabled={state === 'uploading'}
          className={cn(
            'grid size-12 flex-shrink-0 place-items-center rounded-full text-white shadow-sm transition-all',
            state === 'recording'
              ? 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-200 dark:ring-rose-500/30 animate-pulse'
              : 'bg-brand hover:bg-brand-hover',
            state === 'uploading' && 'cursor-wait opacity-60',
          )}
          title={
            state === 'recording'
              ? 'Kaydı durdur'
              : state === 'uploading'
                ? 'Yükleniyor...'
                : 'Ses notu kaydet'
          }
        >
          <Icon
            name={
              state === 'recording'
                ? 'stop'
                : state === 'uploading'
                  ? 'progress_activity'
                  : 'mic'
            }
            size="md"
            className={cn('!text-[20px]', state === 'uploading' && 'animate-spin')}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-token-text">
            {state === 'idle' && 'Ses notu kaydet'}
            {state === 'recording' && (
              <span className="font-mono">Kayıt — {timeStr}</span>
            )}
            {state === 'uploading' && 'Whisper ile metne çevriliyor…'}
            {state === 'success' && 'Aktivite oluşturuldu ✓'}
            {state === 'error' && 'Hata'}
          </div>
          <div className="mt-0.5 text-[11px] text-token-muted">
            {state === 'idle' &&
              'Mikrofon ikonuna bas, görüşmeyi anlat — otomatik aktivite kaydı oluşur.'}
            {state === 'recording' && 'Bitirmek için aynı düğmeye tekrar bas.'}
            {state === 'uploading' && 'Birkaç saniye sürebilir.'}
            {state === 'success' && 'Aktiviteler listesinde görünür.'}
            {state === 'error' && error}
          </div>
        </div>

        {(state === 'success' || state === 'error') && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md p-1.5 text-token-muted hover:bg-token-bg-hover hover:text-token-text"
            title="Yeniden"
          >
            <Icon name="refresh" size="sm" />
          </button>
        )}
      </div>

      {transcript && state === 'success' && (
        <div className="mt-3 rounded-md border border-token-border bg-token-bg-subtle px-3 py-2 text-[12px] leading-relaxed text-token-text">
          <strong className="text-[10px] uppercase tracking-wider text-token-muted">
            Çeviri
          </strong>
          <div className="mt-1">{transcript}</div>
        </div>
      )}
    </div>
  );
}
