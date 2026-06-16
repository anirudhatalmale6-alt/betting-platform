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
      if (isRegister) {
        await register(form);
        toast.success('Account created!');
      } else {
        await login(form.username, form.password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const demoLogin = async (username, password, label) => {
    setLoading(true);
    try {
      await login(username, password);
      toast.success(`Logged in as ${label}`);
      navigate('/');
    } catch (error) { toast.error('Demo login failed'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl mb-3">
            <span className="text-3xl font-black text-dark-900">BP</span>
          </div>
          <h1 className="text-2xl font-black text-white">BETTING<span className="text-primary-400">PRO</span></h1>
          <p className="text-xs text-dark-400 mt-1">India's #1 Betting Exchange</p>
        </div>

        {/* Quick Demo */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 mb-3">
          <div className="text-[10px] text-dark-400 font-semibold mb-2 text-center uppercase">Quick Demo Login</div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => demoLogin('admin', 'admin123', 'Admin')} disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-2 rounded text-xs font-bold transition-all disabled:opacity-50">
              ⚙️ Admin
            </button>
            <button onClick={() => demoLogin('bookmaker1', 'bookmaker123', 'Bookmaker')} disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-2 rounded text-xs font-bold transition-all disabled:opacity-50">
              📊 Bookmaker
            </button>
            <button onClick={() => demoLogin('player1', 'player123', 'Player')} disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white py-2 rounded text-xs font-bold transition-all disabled:opacity-50">
              🎮 Player
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
          <div className="flex mb-4 bg-dark-900 rounded p-0.5">
            <button onClick={() => setIsRegister(false)} className={`flex-1 py-2 rounded text-xs font-bold transition-all ${!isRegister ? 'bg-primary-500 text-dark-900' : 'text-dark-400'}`}>
              LOGIN
            </button>
            <button onClick={() => setIsRegister(true)} className={`flex-1 py-2 rounded text-xs font-bold transition-all ${isRegister ? 'bg-primary-500 text-dark-900' : 'text-dark-400'}`}>
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Username" required className="input-field"
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <input type="password" placeholder="Password" required className="input-field"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            {isRegister && (
              <>
                <input type="text" placeholder="Full Name" className="input-field" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                <input type="tel" placeholder="Phone Number" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 rounded font-black text-dark-900 text-sm transition-all disabled:opacity-50">
              {loading ? 'Please wait...' : isRegister ? 'CREATE ACCOUNT' : 'LOGIN'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 text-[10px] text-dark-500">Play Responsibly | 18+ Only</div>
      </div>
    </div>
  );
}
