import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: d } = await adminAPI.getDashboard();
      setData(d);
    } catch (e) {}
    setLoading(false);
  };

  if (loading) return <div className="text-center py-10 text-dark-400">Loading dashboard...</div>;
  if (!data) return <div className="text-center py-10 text-dark-400">Failed to load</div>;

  const stats = [
    { label: 'Total Users', value: data.stats.totalUsers, color: 'text-blue-400', icon: '👥' },
    { label: 'Active Players', value: data.stats.activePlayers, color: 'text-green-400', icon: '🎮' },
    { label: 'Total Bets', value: data.stats.totalBets, color: 'text-yellow-400', icon: '🎯' },
    { label: 'Pending Bets', value: data.stats.pendingBets, color: 'text-orange-400', icon: '⏳' },
    { label: 'Deposits', value: `₹${data.stats.totalDeposits.toLocaleString('en-IN')}`, color: 'text-green-400', icon: '💰' },
    { label: 'Withdrawals', value: `₹${data.stats.totalWithdrawals.toLocaleString('en-IN')}`, color: 'text-red-400', icon: '💸' },
    { label: 'Live Events', value: data.stats.liveEvents, color: 'text-red-400', icon: '🔴' },
    { label: 'Total Exposure', value: `₹${data.stats.totalExposure.toLocaleString('en-IN')}`, color: 'text-yellow-400', icon: '⚠️' }
  ];

  const adminLinks = [
    { path: '/admin/users', label: 'Manage Users', icon: '👥' },
    { path: '/admin/events', label: 'Manage Events', icon: '🏏' },
    { path: '/admin/bets', label: 'Manage Bets', icon: '🎯' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">⚙️ Admin Dashboard</h1>
        <button onClick={loadDashboard} className="text-sm text-primary-400 hover:text-primary-300">Refresh</button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {adminLinks.map(link => (
          <Link key={link.path} to={link.path} className="card p-4 text-center hover:border-primary-500/50 transition-colors">
            <div className="text-2xl mb-1">{link.icon}</div>
            <div className="text-sm font-medium text-dark-200">{link.label}</div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{stat.icon}</span>
              <span className="text-xs text-dark-400">{stat.label}</span>
            </div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Bets */}
      <div className="card">
        <div className="px-4 py-3 border-b border-dark-700">
          <h2 className="font-semibold text-white">Recent Bets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dark-400 text-xs border-b border-dark-700">
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Event</th>
                <th className="px-4 py-2 text-left">Selection</th>
                <th className="px-4 py-2 text-center">Type</th>
                <th className="px-4 py-2 text-right">Odds</th>
                <th className="px-4 py-2 text-right">Stake</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentBets.map(bet => (
                <tr key={bet.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                  <td className="px-4 py-2 text-dark-200">{bet.username}</td>
                  <td className="px-4 py-2 text-dark-300 text-xs">{bet.event_name}</td>
                  <td className="px-4 py-2 text-dark-200">{bet.runner_name}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${bet.bet_type === 'back' ? 'bg-back/20 text-back-dark' : 'bg-lay/20 text-lay-dark'}`}>
                      {bet.bet_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-dark-200">{parseFloat(bet.odds).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-dark-200">₹{parseFloat(bet.stake).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      bet.status === 'matched' ? 'bg-yellow-500/20 text-yellow-400' :
                      bet.result === 'won' ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-300'
                    }`}>{bet.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
