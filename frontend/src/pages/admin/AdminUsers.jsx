import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showBalance, setShowBalance] = useState(null);
  const [filter, setFilter] = useState({ role: '', search: '' });
  const [form, setForm] = useState({ username: '', password: '', role: 'player', full_name: '', phone: '', balance: '0', credit_limit: '100000' });
  const [balForm, setBalForm] = useState({ amount: '', type: 'deposit', description: '' });

  useEffect(() => { loadUsers(); }, [filter.role]);

  const loadUsers = async () => {
    try {
      const params = {};
      if (filter.role) params.role = filter.role;
      if (filter.search) params.search = filter.search;
      const { data } = await adminAPI.getUsers(params);
      setUsers(data);
    } catch (e) {}
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(form);
      toast.success('User created');
      setShowCreate(false);
      setForm({ username: '', password: '', role: 'player', full_name: '', phone: '', balance: '0', credit_limit: '100000' });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await adminAPI.updateUser(user.id, { status: newStatus });
      toast.success(`User ${newStatus}`);
      loadUsers();
    } catch (e) { toast.error('Failed'); }
  };

  const adjustBalance = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.adjustBalance(showBalance.id, balForm);
      toast.success('Balance updated');
      setShowBalance(null);
      setBalForm({ amount: '', type: 'deposit', description: '' });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">👥 Users</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Create User</button>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="Search..." className="input-field max-w-xs" value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} onKeyDown={e => e.key === 'Enter' && loadUsers()} />
        <select className="input-field max-w-[150px]" value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="bookmaker">Bookmaker</option>
          <option value="player">Player</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-dark-400 text-xs border-b border-dark-700">
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-center">Role</th>
              <th className="px-4 py-2 text-right">Balance</th>
              <th className="px-4 py-2 text-right">Exposure</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                <td className="px-4 py-2 font-medium text-dark-200">{u.username}</td>
                <td className="px-4 py-2 text-dark-300">{u.full_name}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                    u.role === 'bookmaker' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-2 text-right text-green-400">₹{parseFloat(u.balance).toLocaleString('en-IN')}</td>
                <td className="px-4 py-2 text-right text-red-400">₹{parseFloat(u.exposure).toLocaleString('en-IN')}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-center space-x-1">
                  <button onClick={() => setShowBalance(u)} className="text-xs text-primary-400 hover:text-primary-300">💰 D/W</button>
                  <button onClick={() => toggleStatus(u)} className="text-xs text-yellow-400 hover:text-yellow-300">
                    {u.status === 'active' ? '🔒' : '🔓'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-600 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Create User</h3>
            <form onSubmit={createUser} className="space-y-3">
              <input type="text" placeholder="Username" className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
              <input type="password" placeholder="Password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <input type="text" placeholder="Full Name" className="input-field" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              <input type="text" placeholder="Phone" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="player">Player</option>
                <option value="bookmaker">Bookmaker</option>
                <option value="admin">Admin</option>
              </select>
              <input type="number" placeholder="Initial Balance" className="input-field" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
              <input type="number" placeholder="Credit Limit" className="input-field" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: e.target.value })} />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="bg-dark-700 px-4 py-2 rounded-lg text-dark-300 flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {showBalance && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowBalance(null)}>
          <div className="bg-dark-800 rounded-2xl w-full max-w-sm border border-dark-600 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Adjust Balance</h3>
            <p className="text-sm text-dark-400 mb-4">{showBalance.username} - Current: ₹{parseFloat(showBalance.balance).toLocaleString('en-IN')}</p>
            <form onSubmit={adjustBalance} className="space-y-3">
              <select className="input-field" value={balForm.type} onChange={e => setBalForm({ ...balForm, type: e.target.value })}>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
              <input type="number" placeholder="Amount" className="input-field" value={balForm.amount} onChange={e => setBalForm({ ...balForm, amount: e.target.value })} required />
              <input type="text" placeholder="Description (optional)" className="input-field" value={balForm.description} onChange={e => setBalForm({ ...balForm, description: e.target.value })} />
              <div className="flex gap-3">
                <button type="submit" className={`flex-1 py-2 rounded-lg font-semibold text-white ${balForm.type === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {balForm.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                </button>
                <button type="button" onClick={() => setShowBalance(null)} className="bg-dark-700 px-4 py-2 rounded-lg text-dark-300 flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
