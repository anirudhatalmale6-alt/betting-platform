import { useState, useEffect } from 'react';
import { betsAPI } from '../services/api';

export default function MyBetsPage() {
  const [bets, setBets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBets(); }, [filter]);

  const loadBets = async () => {
    try {
      const params = { limit: 100 };
      if (filter !== 'all') params.status = filter;
      const { data } = await betsAPI.getMyBets(params);
      setBets(data);
    } catch (e) {}
    setLoading(false);
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'matched', label: 'Active' },
    { key: 'settled', label: 'Settled' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">📋 My Bets</h1>

      <div className="flex gap-2">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === f.key ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-dark-400">Loading...</div>
      ) : bets.length === 0 ? (
        <div className="text-center py-10 text-dark-400">No bets found</div>
      ) : (
        <div className="space-y-2">
          {bets.map(bet => (
            <div key={bet.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${bet.bet_type === 'back' ? 'bg-back/20 text-back-dark' : 'bg-lay/20 text-lay-dark'}`}>
                    {bet.bet_type.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-white">{bet.runner_name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  bet.status === 'matched' ? 'bg-yellow-500/20 text-yellow-400' :
                  bet.result === 'won' ? 'bg-green-500/20 text-green-400' :
                  bet.result === 'lost' ? 'bg-red-500/20 text-red-400' : 'bg-dark-600 text-dark-300'
                }`}>
                  {bet.status === 'matched' ? 'ACTIVE' : bet.result?.toUpperCase() || bet.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-dark-400 mb-2">{bet.event_name} &bull; {bet.market_name}</div>
              <div className="flex items-center justify-between text-sm">
                <div className="space-x-4">
                  <span className="text-dark-400">Odds: <span className="text-white font-medium">{parseFloat(bet.odds).toFixed(2)}</span></span>
                  <span className="text-dark-400">Stake: <span className="text-white font-medium">₹{parseFloat(bet.stake).toLocaleString('en-IN')}</span></span>
                </div>
                {bet.status === 'settled' && (
                  <span className={`font-bold ${parseFloat(bet.profit_loss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(bet.profit_loss) >= 0 ? '+' : ''}₹{parseFloat(bet.profit_loss).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-dark-500 mt-2">{new Date(bet.placed_at).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
