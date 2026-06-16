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

  const demoLogin = async (role) => {
    setLoading(true);
    try {
      const creds = { admin: ['admin', 'admin123'], bookmaker: ['bookmaker1', 'bookmaker123'], player: ['demo', 'player123'] };
      await login(creds[role][0], creds[role][1]);
      toast.success(`Logged in as ${role}`);
      navigate('/');
    } catch (error) {
      toast.error('Demo login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center font-bold text-white text-2xl mx-auto mb-4">BP</div>
          <h1 className="text-3xl font-bold text-white">Betting<span className="text-primary-500">Pro</span></h1>
          <p className="text-dark-400 mt-1">India's #1 Betting Exchange</p>
        </div>

        <div className="card p-6">
          <div className="flex mb-6 bg-dark-900 rounded-lg p-1">
            <button onClick={() => setIsRegister(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isRegister ? 'bg-primary-500 text-white' : 'text-dark-400'}`}>Login</button>
            <button onClick={() => setIsRegister(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isRegister ? 'bg-primary-500 text-white' : 'text-dark-400'}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Username</label>
              <input type="text" className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Password</label>
              <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Full Name</label>
                  <input type="text" className="input-field" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Phone</label>
                  <input type="text" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-dark-700">
            <p className="text-dark-400 text-sm text-center mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => demoLogin('admin')} className="bg-red-500/20 text-red-400 py-2 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">Admin</button>
              <button onClick={() => demoLogin('bookmaker')} className="bg-blue-500/20 text-blue-400 py-2 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors">Bookmaker</button>
              <button onClick={() => demoLogin('player')} className="bg-green-500/20 text-green-400 py-2 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors">Player</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
