import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) { await register(form); toast.success('Account created!'); }
      else { await login(form.username, form.password); toast.success('Welcome back!'); }
      navigate('/');
    } catch (error) { toast.error(error.response?.data?.error || 'Login failed'); }
    setLoading(false);
  };

  const demoLogin = async () => {
    setLoading(true);
    try { await login('demo', 'player123'); toast.success('Demo mode active!'); navigate('/'); }
    catch (error) { toast.error('Demo login failed'); }
    setLoading(false);
  };

  const quickLogin = async (username, password, label) => {
    setLoading(true);
    try { await login(username, password); toast.success(`Logged in as ${label}`); navigate('/'); }
    catch (error) { toast.error('Login failed'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card - Reddybook style */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex">
          {/* Left: Form */}
          <div className="flex-1 p-6">
            <div className="text-center mb-4">
              <div className="text-xl font-black"><span className="text-brand-600">BETTING</span><span className="text-dark-900">PRO</span></div>
            </div>

            <div className="text-xs text-gray-500 font-semibold mb-1">USERNAME / MOBILE NUMBER</div>
            <input type="text" className="input-field mb-3" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />

            <div className="text-xs text-gray-500 font-semibold mb-1">PASSWORD</div>
            <input type="password" className="input-field mb-3" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

            {isRegister && (
              <>
                <div className="text-xs text-gray-500 font-semibold mb-1">FULL NAME</div>
                <input type="text" className="input-field mb-3" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                <div className="text-xs text-gray-500 font-semibold mb-1">PHONE</div>
                <input type="tel" className="input-field mb-3" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </>
            )}

            <label className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <input type="checkbox" className="rounded" /> Remember Me?
            </label>

            <button onClick={() => !isRegister ? document.getElementById('loginForm')?.requestSubmit() : null} className="text-xs text-brand-600 hover:underline mb-3 block">
              Forgot Password/Username?
            </button>

            <form id="loginForm" onSubmit={handleSubmit} className="space-y-2">
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-dark-800 text-white rounded font-bold text-sm hover:bg-dark-900 disabled:opacity-50">
                {isRegister ? 'REGISTER' : 'LOG IN'}
              </button>
            </form>

            <button onClick={demoLogin} disabled={loading} className="w-full py-2.5 bg-white border-2 border-dark-800 text-dark-800 rounded font-bold text-sm hover:bg-gray-50 mt-2 disabled:opacity-50">
              LOGIN WITH DEMO ID
            </button>

            <button onClick={() => setIsRegister(!isRegister)} className="w-full text-center text-xs text-brand-600 hover:underline mt-3">
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>

            <div className="text-center text-[10px] text-gray-400 mt-4">
              Powered By <span className="text-brand-600 font-bold">BettingPro</span>
            </div>
          </div>

          {/* Right: Sports Banner */}
          <div className="hidden sm:flex w-48 bg-gradient-to-b from-green-500 to-blue-600 items-center justify-center p-4 relative">
            <div className="text-center">
              <div className="text-6xl mb-2">🏏⚽🎾</div>
              <div className="text-white font-black text-2xl">SPORTS</div>
              <div className="text-cyan-200 font-black text-xl">BOOK</div>
            </div>
          </div>
        </div>

        {/* Quick Role Login (for demo) */}
        <div className="bg-white rounded-lg shadow-lg mt-3 p-3">
          <div className="text-[10px] text-gray-400 font-semibold mb-2 text-center">QUICK ROLE LOGIN (DEMO)</div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => quickLogin('admin', 'admin123', 'Admin')} disabled={loading}
              className="bg-purple-600 text-white py-2 rounded text-xs font-bold hover:bg-purple-700 disabled:opacity-50">⚙️ Admin</button>
            <button onClick={() => quickLogin('bookmaker1', 'bookmaker123', 'Bookmaker')} disabled={loading}
              className="bg-blue-600 text-white py-2 rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50">📊 Bookmaker</button>
            <button onClick={() => quickLogin('player1', 'player123', 'Player')} disabled={loading}
              className="bg-green-600 text-white py-2 rounded text-xs font-bold hover:bg-green-700 disabled:opacity-50">🎮 Player</button>
          </div>
        </div>
      </div>
    </div>
  );
}
