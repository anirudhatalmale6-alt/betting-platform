import { useState, useEffect } from 'react';
import { betsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminBets() {
  const [bets, setBets] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadBets(); }, [filter]);

  const loadBets = async () => {
    try {
      const params = { limit: 200 };
      if (filter) params.status = filter;
      const { data } = await betsAPI.getAllBets(params);
      setBets(data);
    } catch (e) {}
  };

  const settleBet = async (betId, result) => {
    try {
      await betsAPI.settleBet({ bet_id: betId, result });
      toast.success(`Bet settled as ${result}`);
      loadBets();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🎯 All Bets</h1>
        <div className="flex gap-2">
          {['', 'matched', 'settled', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300'}`}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-dark-400 text-xs border-b border-dark-700">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Event</th>
              <th className="px-3 py-2 text-left">Selection</th>
              <th className="px-3 py-2 text-center">Type</th>
              <th className="px-3 py-2 text-right">Odds</th>
              <th className="px-3 py-2 text-right">Stake</th>
              <th className="px-3 py-2 text-right">P/L</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bets.map(bet => (
              <tr key={bet.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                <td className="px-3 py-2 text-dark-400 text-xs">#{bet.id}</td>
                <td className="px-3 py-2 text-dark-200">{bet.username}</td>
                <td className="px-3 py-2 text-dark-300 text-xs max-w-[150px] truncate">{bet.event_name}</td>
                <td className="px-3 py-2 text-dark-200">{bet.runner_name}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${bet.bet_type === 'back' ? 'bg-back/20 text-back-dark' : 'bg-lay/20 text-lay-dark'}`}>
                    {bet.bet_type.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{parseFloat(bet.odds).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">₹{parseFloat(bet.stake).toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right">
                  {bet.status === 'settled' && (
                    <span className={parseFloat(bet.profit_loss) >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {parseFloat(bet.profit_loss) >= 0 ? '+' : ''}₹{parseFloat(bet.profit_loss).toLocaleString('en-IN')}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    bet.status === 'matched' ? 'bg-yellow-500/20 text-yellow-400' :
                    bet.result === 'won' ? 'bg-green-500/20 text-green-400' :
                    bet.result === 'lost' ? 'bg-red-500/20 text-red-400' : 'bg-dark-600 text-dark-300'
                  }`}>{bet.status === 'matched' ? 'ACTIVE' : bet.result || bet.status}</span>
                </td>
                <td className="px-3 py-2 text-center">
                  {bet.status === 'matched' && (
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => settleBet(bet.id, 'won')} className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">Won</button>
                      <button onClick={() => settleBet(bet.id, 'lost')} className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">Lost</button>
                      <button onClick={() => settleBet(bet.id, 'void')} className="text-[10px] px-2 py-0.5 bg-dark-600 text-dark-300 rounded hover:bg-dark-500">Void</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bets.length === 0 && <div className="text-center py-6 text-dark-400">No bets found</div>}
      </div>
    </div>
  );
}
