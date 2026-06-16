import { useState, useEffect } from 'react';
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

  useEffect(() => { loadEvent(); }, [id]);

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
    return () => { socket.emit('leave_event', parseInt(id)); socket.off('odds_update'); socket.off('score_update'); };
  }, [socket, id]);

  const loadEvent = async () => {
    try {
      const { data } = await eventsAPI.getEventDetail(id);
      setEvent(data.event);
      setMarkets(data.markets);
    } catch (e) { toast.error('Failed to load event'); }
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
    if (!stake || parseFloat(stake) <= 0) return toast.error('Enter valid stake');
    setPlacing(true);
    try {
      const { data } = await betsAPI.placeBet({
        market_id: betSlip.market.id, runner_id: betSlip.runner.id,
        bet_type: betSlip.type, odds: betSlip.odds, stake: parseFloat(stake)
      });
      toast.success(`Bet placed! Profit: ₹${data.potential_profit.toLocaleString('en-IN')}`);
      updateBalance(data.new_balance);
      setBetSlip(null); setStake('');
      refreshProfile();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    setPlacing(false);
  };

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;
  if (!event) return <div className="text-center py-20 text-dark-400">Event not found</div>;

  const sportIcons = { cricket: '🏏', football: '⚽', tennis: '🎾' };
  const matchOdds = markets.filter(m => m.market_type === 'match_odds');
  const bookmaker = markets.filter(m => m.market_type === 'bookmaker');
  const fancy = markets.filter(m => m.market_type === 'fancy');

  return (
    <div className="space-y-2">
      {/* Score Bar */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-900 rounded-lg border border-dark-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{sportIcons[event.sport_slug] || '🏅'}</span>
            <span className="text-xs text-dark-400">{event.tournament_name}</span>
          </div>
          {event.is_live ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-accent-red/20 rounded text-xs text-accent-red font-bold">
              <span className="live-pulse w-1.5 h-1.5 bg-accent-red rounded-full"></span>LIVE
            </span>
          ) : (
            <span className="text-xs text-dark-400">{new Date(event.start_time).toLocaleString('en-IN')}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-2 bg-dark-700/30 rounded">
            <div className="font-bold text-white text-sm">{event.team_a}</div>
            {event.is_live && event.score_a !== '0' && (
              <div className="text-primary-400 font-mono font-bold text-lg mt-0.5">{event.score_a}</div>
            )}
          </div>
          <div className="text-center p-2 bg-dark-700/30 rounded">
            <div className="font-bold text-white text-sm">{event.team_b}</div>
            {event.is_live && event.score_b !== '0' && (
              <div className="text-primary-400 font-mono font-bold text-lg mt-0.5">{event.score_b}</div>
            )}
          </div>
        </div>
      </div>

      {/* Match Odds */}
      {matchOdds.map(market => (
        <MarketTable key={market.id} market={market} title="Match Odds" openBetSlip={openBetSlip} />
      ))}

      {/* Bookmaker */}
      {bookmaker.map(market => (
        <MarketTable key={market.id} market={market} title="Bookmaker" openBetSlip={openBetSlip} />
      ))}

      {/* Fancy Markets */}
      {fancy.length > 0 && (
        <div className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-dark-700 to-dark-800 px-3 py-2 flex items-center justify-between">
            <span className="font-bold text-sm text-primary-400">FANCY</span>
            <div className="flex gap-4 text-[10px] text-dark-400 font-semibold">
              <span className="w-14 text-center">NO</span>
              <span className="w-14 text-center">YES</span>
            </div>
          </div>
          {fancy.map(market => (
            <div key={market.id} className="border-t border-dark-700/50">
              {market.runners.map(runner => (
                <div key={runner.id} className="flex items-center px-3 py-2 hover:bg-dark-700/20">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-dark-200 truncate">{market.name}</div>
                    {market.status === 'suspended' && <span className="text-[10px] text-accent-red">SUSPENDED</span>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openBetSlip(market, runner, 'lay')}
                      disabled={market.status !== 'open'}
                      className="lay-btn w-14 py-1.5 rounded text-center disabled:opacity-30"
                    >
                      <div className="text-xs font-bold">{parseFloat(runner.lay_price).toFixed(0)}</div>
                      <div className="text-[8px] opacity-60">{parseInt(runner.lay_size).toLocaleString()}</div>
                    </button>
                    <button
                      onClick={() => openBetSlip(market, runner, 'back')}
                      disabled={market.status !== 'open'}
                      className="back-btn w-14 py-1.5 rounded text-center disabled:opacity-30"
                    >
                      <div className="text-xs font-bold">{parseFloat(runner.back_price).toFixed(0)}</div>
                      <div className="text-[8px] opacity-60">{parseInt(runner.back_size).toLocaleString()}</div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Bet Slip */}
      {betSlip && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50" onClick={() => setBetSlip(null)}>
          <div className="bg-dark-800 w-full max-w-sm rounded-t-xl sm:rounded-xl border border-dark-600" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`px-4 py-3 rounded-t-xl flex justify-between items-center ${betSlip.type === 'back' ? 'bg-back' : 'bg-lay'}`}>
              <div>
                <div className="font-bold text-dark-900 text-sm">{betSlip.type === 'back' ? 'BACK' : 'LAY'} (Bet For)</div>
                <div className="text-dark-900/70 text-xs">{betSlip.runner.name} - {betSlip.market.name}</div>
              </div>
              <button onClick={() => setBetSlip(null)} className="text-dark-900/50 hover:text-dark-900 text-xl font-bold">&times;</button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-dark-400 mb-1 block font-semibold">ODDS</label>
                  <input type="number" step="0.01" className="input-field text-center font-bold" value={betSlip.odds} onChange={e => setBetSlip({ ...betSlip, odds: parseFloat(e.target.value) })} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-dark-400 mb-1 block font-semibold">STAKE (₹)</label>
                  <input type="number" className="input-field text-center font-bold" value={stake} onChange={e => setStake(e.target.value)} placeholder="Amount" autoFocus />
                </div>
              </div>

              {/* Quick Stakes */}
              <div className="grid grid-cols-4 gap-1.5">
                {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(amt => (
                  <button key={amt} onClick={() => setStake(String(amt))} className="bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded py-1.5 text-[11px] font-bold text-dark-200 transition-colors">
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              {/* P/L Preview */}
              {stake && parseFloat(stake) > 0 && (
                <div className="bg-dark-900 rounded p-2.5 space-y-1 border border-dark-700">
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-400">Profit</span>
                    <span className="text-accent-green font-bold">
                      +₹{(betSlip.type === 'back' ? parseFloat(stake) * (betSlip.odds - 1) : parseFloat(stake)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-400">Loss</span>
                    <span className="text-danger font-bold">
                      -₹{(betSlip.type === 'back' ? parseFloat(stake) : parseFloat(stake) * (betSlip.odds - 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={placeBet}
                disabled={placing || !stake || parseFloat(stake) <= 0}
                className={`w-full py-3 rounded font-bold text-dark-900 text-sm transition-all disabled:opacity-50 ${
                  betSlip.type === 'back' ? 'bg-back hover:bg-back-dark' : 'bg-lay hover:bg-lay-dark'
                }`}
              >
                {placing ? 'Placing...' : `PLACE ${betSlip.type.toUpperCase()} BET`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MarketTable({ market, title, openBetSlip }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
      {/* Market Header */}
      <div className="bg-gradient-to-r from-dark-700 to-dark-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-primary-400">{title}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            market.status === 'open' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
          }`}>{market.status === 'open' ? 'ACTIVE' : market.status.toUpperCase()}</span>
        </div>
        <div className="flex text-[10px] text-dark-400 font-semibold">
          <span className="w-14 text-center text-back-dark">BACK</span>
          <span className="w-14 text-center text-lay-dark">LAY</span>
        </div>
      </div>

      {/* Runners */}
      {market.runners.map(runner => (
        <div key={runner.id} className="flex items-center px-3 py-1.5 border-t border-dark-700/50 hover:bg-dark-700/20 transition-colors">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-dark-200">{runner.name}</span>
          </div>
          <div className="flex gap-1">
            {/* Back */}
            <button
              onClick={() => openBetSlip(market, runner, 'back')}
              disabled={market.status !== 'open' || parseFloat(runner.back_price) <= 0}
              className="back-btn w-14 py-1.5 rounded text-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <div className="text-xs font-bold">{parseFloat(runner.back_price).toFixed(2)}</div>
              <div className="text-[8px] opacity-60">{parseInt(runner.back_size).toLocaleString()}</div>
            </button>
            {/* Lay */}
            <button
              onClick={() => openBetSlip(market, runner, 'lay')}
              disabled={market.status !== 'open' || parseFloat(runner.lay_price) <= 0}
              className="lay-btn w-14 py-1.5 rounded text-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <div className="text-xs font-bold">{parseFloat(runner.lay_price).toFixed(2)}</div>
              <div className="text-[8px] opacity-60">{parseInt(runner.lay_size).toLocaleString()}</div>
            </button>
          </div>
        </div>
      ))}

      {/* Min/Max */}
      <div className="px-3 py-1 bg-dark-900/50 text-[10px] text-dark-500 flex gap-3">
        <span>Min: ₹{market.min_bet}</span>
        <span>Max: ₹{parseInt(market.max_bet).toLocaleString()}</span>
      </div>
    </div>
  );
}
