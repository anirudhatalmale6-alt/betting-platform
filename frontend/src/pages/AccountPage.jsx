import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await authAPI.getProfile();
      setProfile(data);
    } catch (e) {}
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await authAPI.changePassword(passwords);
      toast.success('Password changed');
      setPasswords({ current_password: '', new_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  if (!profile) return <div className="text-center py-10 text-dark-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">👤 My Account</h1>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Profile Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-sm text-dark-400">Username</span><p className="font-medium">{profile.username}</p></div>
          <div><span className="text-sm text-dark-400">Full Name</span><p className="font-medium">{profile.full_name}</p></div>
          <div><span className="text-sm text-dark-400">Role</span><p className="font-medium capitalize">{profile.role}</p></div>
          <div><span className="text-sm text-dark-400">Phone</span><p className="font-medium">{profile.phone || '-'}</p></div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Balance</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <div className="text-sm text-dark-400">Balance</div>
            <div className="text-xl font-bold text-green-400">₹{parseFloat(profile.balance).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <div className="text-sm text-dark-400">Exposure</div>
            <div className="text-xl font-bold text-red-400">₹{parseFloat(profile.exposure).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <div className="text-sm text-dark-400">Available</div>
            <div className="text-xl font-bold text-primary-400">₹{(parseFloat(profile.balance) - parseFloat(profile.exposure)).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input type="password" placeholder="Current Password" className="input-field" value={passwords.current_password} onChange={e => setPasswords({ ...passwords, current_password: e.target.value })} required />
          <input type="password" placeholder="New Password" className="input-field" value={passwords.new_password} onChange={e => setPasswords({ ...passwords, new_password: e.target.value })} required />
          <button type="submit" className="btn-primary">Update Password</button>
        </form>
      </div>
    </div>
  );
}
