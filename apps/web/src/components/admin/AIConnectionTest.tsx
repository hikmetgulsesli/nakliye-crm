import { useState } from 'react';
import { Button, Icon } from '@/components/ui';
import { aiService } from '@/services/ai.service';
import { cn } from '@/utils/cn';

interface TestResult {
  ok: boolean;
  provider?: string;
  model?: string;
  latencyMs?: number;
  error?: string;
}

interface AIConnectionTestProps {
  /** Hicbir sagleyici yapilandirilmamissa buton pasif */
  disabled?: boolean;
}

/**
 * Settings > AI Genel kartına eklenir. Tek tıkla yapılandırılmış sağlayıcıya
 * kısa bir "ping" prompt gönderir, sonucu kullanıcıya göstirir. Pratik:
 * "API key'i girdim ama gerçekten çalışıyor mu?" sorusunu cevaplar.
 */
export function AIConnectionTest({ disabled }: AIConnectionTestProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function runTest() {
    setTesting(true);
    setResult(null);
    try {
      const r = await aiService.testConnection();
      setResult(r);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-token-border bg-token-bg-subtle px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-token-text">Bağlantı testi</div>
        <div className="mt-0.5 text-xs text-token-muted">
          Yapılandırılmış sağlayıcıya kısa bir istek gönderir, gerçekten yanıt
          dönüyor mu kontrol eder.
        </div>
        {result && (
          <div
            className={cn(
              'mt-2 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs',
              result.ok
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
            )}
          >
            <Icon
              name={result.ok ? 'check_circle' : 'error'}
              size="sm"
              className="!text-[14px]"
            />
            {result.ok ? (
              <span>
                Bağlandı
                {result.provider && ` · ${result.provider}`}
                {result.model && ` (${result.model})`}
                {result.latencyMs !== undefined && ` · ${result.latencyMs}ms`}
              </span>
            ) : (
              <span>Hata: {result.error}</span>
            )}
          </div>
        )}
      </div>
      <Button
        size="sm"
        variant="secondary"
        icon={testing ? 'progress_activity' : 'electric_bolt'}
        onClick={runTest}
        disabled={disabled || testing}
      >
        {testing ? 'Test ediliyor…' : 'Bağlantıyı test et'}
      </Button>
    </div>
  );
}
