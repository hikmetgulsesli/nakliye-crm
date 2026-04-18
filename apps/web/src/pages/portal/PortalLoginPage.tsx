import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PortalLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/portal/auth/request-otp', { email });
      setStep('code');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Hata');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post('/api/portal/auth/verify-otp', { email, code });
      localStorage.setItem('portal_token', data.data.token);
      navigate('/portal');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Hata');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex size-12 rounded-xl bg-[#e30a17] items-center justify-center mb-3">
            <span className="material-symbols-outlined text-white text-2xl">business</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Müşteri Portalı</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            E-posta adresinize giriş kodu gönderilir
          </p>
        </div>

        {step === 'email' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sirket@example.com"
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={requestOtp}
              disabled={!email || loading}
              className="w-full h-11 rounded-xl bg-[#e30a17] text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Giriş Kodu Gönder'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>{email}</strong> adresine gönderilen 6 haneli kodu girin:
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center text-2xl tracking-widest font-mono"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={code.length !== 6 || loading}
              className="w-full h-11 rounded-xl bg-[#e30a17] text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
            </button>
            <button
              onClick={() => setStep('email')}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              E-postayı değiştir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
