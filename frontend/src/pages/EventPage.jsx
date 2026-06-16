import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { eventsAPI, betsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [betSlip, setBetSlip] = useState(null);
  const [stake, setStake] = useState('');
  const [placing, setPlacing] = useState(false);
  const socket = useSocket();
  const { user, updateBalance, refreshProfile } = useAuth();

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join_event', parseInt(id));

    socket.on('odds_update', (data) => {
      if (data.event_id === parseInt(id)) {
        setMarkets(prev => prev.map(market => ({
          ...market,
          runners: market.runners.map(runner => {
            const update = data.runners.find(r => r.runner_id === runner.id);
            return update ? { ...runner, back_price: update.back_price, lay_price: update.lay_price, back_size: update.back_size, lay_size: update.lay_size, _flash: Date.now() } : runner;
          })
        })));
      }
    });

    socket.on('score_update', (data) => {
      if (data.event_id === parseInt(id)) {
        setEvent(prev => prev ? { ...prev, score_a: data.score_a, score_b: data.score_b } : prev);
      }
    });

    return () => {
      socket.emit('leave_event', parseInt(id));
      socket.off('odds_update');
      socket.off('score_update');
    };
  }, [socket, id]);

  const loadEvent = async () => {
    try {
      const { data } = await eventsAPI.getEventDetail(id);
      setEvent(data.event);
      setMarkets(data.markets);
    } catch (error) {
      toast.error('Failed to load event');
    }
    setLoading(false);
  };

  const openBetSlip = (market, runner, type) => {
    if (!user) return toast.error('Please login to place bets');
    if (user.role !== 'player') return toast.error('Only players can place bets');
    const price = type === 'back' ? runner.back_price : runner.lay_price;
    setBetSlip({ market, runner, type, odds: parseFloat(price) });
    setStake('');
  };

  const placeBet = async () => {
    if (!stake || parseFloat(stake) <= 0) return toast.error('Enter a valid stake');
    setPlacing(true);
    try {
      const { data } = await betsAPI.placeBet({
        market_id: betSlip.market.id,
        runner_id: betSlip.runner.id,
        bet_type: betSlip.type,
        odds: betSlip.odds,
        stake: parseFloat(stake)
      });
      toast.success(`Bet placed! Potential profit: ₹${data.potential_profit.toLocaleString('en-IN')}`);
      updateBalance(data.new_balance);
      setBetSlip(null);
      setStake('');
      refreshProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place bet');
    }
    setPlacing(false);
  };

  if (loading) return <div className="text-center py-20 text-dark-400">Loading event...</div>;
  if (!event) return <div className="text-center py-20 text-dark-400">Event not found</div>;

  const sportIcons = { cricket: '🏏', football: '⚽', tennis: '🎾' };

  return (
    <div className="space-y-4">
      {/* Event Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{sportIcons[event.sport_slug] || '🏅'}</span>
            <span className="text-sm text-dark-400">{event.tournament_name || event.sport_name}</span>
          </div>
          {event.is_live ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-bold">
              <span className="live-pulse w-2 h-2 bg-red-500 rounded-full inline-block"></span> LIVE
            </span>
          ) : (
            <span className="text-sm text-dark-400">{new Date(event.start_time).toLocaleString('en-IN')}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">{event.team_a}</span>
              {event.is_live && event.score_a !== '0' && <span className="text-primary-400 font-mono text-lg">{event.score_a}</span>}
            </div>
            <div className="text-dark-500 text-sm">vs</div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">{event.team_b}</span>
              {event.is_live && event.score_b !== '0' && <span className="text-primary-400 font-mono text-lg">{event.score_b}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Markets */}
      {markets.map(market => (
        <div key={market.id} className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-dark-700/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{market.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                market.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>{market.status}</span>
            </div>
            <div className="flex gap-8 text-[10px] text-dark-400">
              <span className="w-16 text-center">BACK</span>
              <span className="w-16 text-center">LAY</span>
            </div>
          </div>

          <div className="divide-y divide-dark-700/50">
            {market.runners.map(runner => (
              <div key={runner.id} className="flex items-center justify-between px-4 py-2 hover:bg-dark-700/30 transition-colors">
                <div className="flex-1">
                  <span className="text-sm font-medium text-dark-200">{runner.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openBetSlip(market, runner, 'back')}
                    disabled={market.status !== 'open' || runner.status !== 'active' || parseFloat(runner.back_price) <= 0}
                    className="w-16 text-center bg-back/20 hover:bg-back/40 disabled:opacity-30 disabled:cursor-not-allowed rounded py-1.5 transition-colors"
                  >
                    <div className="text-sm font-bold text-back-dark">{parseFloat(runner.back_price).toFixed(2)}</div>
                    <div className="text-[9px] text-dark-400">{parseInt(runner.back_size).toLocaleString()}</div>
                  </button>
                  <button
                    onClick={() => openBetSlip(market, runner, 'lay')}
                    disabled={market.status !== 'open' || runner.status !== 'active' || parseFloat(runner.lay_price) <= 0}
                    className="w-16 text-center bg-lay/20 hover:bg-lay/40 disabled:opacity-30 disabled:cursor-not-allowed rounded py-1.5 transition-colors"
                  >
                    <div className="text-sm font-bold text-lay-dark">{parseFloat(runner.lay_price).toFixed(2)}</div>
                    <div className="text-[9px] text-dark-400">{parseInt(runner.lay_size).toLocaleString()}</div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Bet Slip Modal */}
      {betSlip && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setBetSlip(null)}>
          <div className="bg-dark-800 rounded-t-2xl sm:rounded-2xl w-full max-w-sm border border-dark-600" onClick={e => e.stopPropagation()}>
            <div className={`px-4 py-3 rounded-t-2xl sm:rounded-t-2xl ${betSlip.type === 'back' ? 'bg-back/20' : 'bg-lay/20'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{betSlip.type === 'back' ? 'BACK' : 'LAY'} - {betSlip.runner.name}</span>
                <button onClick={() => setBetSlip(null)} className="text-dark-400 hover:text-white text-xl">&times;</button>
              </div>
              <div className="text-sm text-dark-300 mt-1">{event.name} &bull; {betSlip.market.name}</div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-dark-400 mb-1 block">Odds</label>
                  <input type="number" step="0.01" className="input-field text-center font-bold text-lg" value={betSlip.odds} onChange={e => setBetSlip({ ...betSlip, odds: parseFloat(e.target.value) })} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-dark-400 mb-1 block">Stake (₹)</label>
                  <input type="number" className="input-field text-center font-bold text-lg" value={stake} onChange={e => setStake(e.target.value)} placeholder="0" autoFocus />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(amt => (
                  <button key={amt} onClick={() => setStake(String(amt))} className="bg-dark-700 hover:bg-dark-600 rounded py-1.5 text-xs font-medium text-dark-200 transition-colors">
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              {stake && parseFloat(stake) > 0 && (
                <div className="bg-dark-900 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Profit</span>
                    <span className="text-green-400 font-semibold">
                      ₹{(betSlip.type === 'back'
                        ? parseFloat(stake) * (betSlip.odds - 1)
                        : parseFloat(stake)
                      ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Liability</span>
                    <span className="text-red-400 font-semibold">
                      ₹{(betSlip.type === 'back'
                        ? parseFloat(stake)
                        : parseFloat(stake) * (betSlip.odds - 1)
                      ).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={placeBet}
                disabled={placing || !stake || parseFloat(stake) <= 0}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors disabled:opacity-50 ${
                  betSlip.type === 'back' ? 'bg-back hover:bg-back-dark' : 'bg-lay hover:bg-lay-dark'
                }`}
              >
                {placing ? 'Placing Bet...' : `Place ${betSlip.type.toUpperCase()} Bet`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
