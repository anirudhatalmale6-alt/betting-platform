import { useState, useEffect } from 'react';
import { eventsAPI, marketsAPI, betsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function BookmakerPanel() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [allBets, setAllBets] = useState([]);

  useEffect(() => { loadEvents(); loadBets(); }, []);

  const loadEvents = async () => {
    try {
      const { data } = await eventsAPI.getEvents({});
      setEvents(data);
    } catch (e) {}
  };

  const loadBets = async () => {
    try {
      const { data } = await betsAPI.getAllBets({ status: 'matched', limit: 50 });
      setAllBets(data);
    } catch (e) {}
  };

  const loadMarkets = async (eventId) => {
    try {
      const { data } = await marketsAPI.getMarkets({ event_id: eventId });
      setMarkets(data);
    } catch (e) {}
  };

  const selectEvent = (event) => {
    setSelectedEvent(event);
    loadMarkets(event.id);
  };

  const updateOdds = async (runnerId, field, value) => {
    try {
      await marketsAPI.updateOdds({ runner_id: runnerId, [field]: parseFloat(value) });
      toast.success('Odds updated');
      if (selectedEvent) loadMarkets(selectedEvent.id);
    } catch (e) { toast.error('Failed'); }
  };

  const toggleMarket = async (marketId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'suspended' : 'open';
    try {
      await marketsAPI.updateMarket(marketId, { status: newStatus });
      toast.success(`Market ${newStatus}`);
      if (selectedEvent) loadMarkets(selectedEvent.id);
    } catch (e) { toast.error('Failed'); }
  };

  const liveEvents = events.filter(e => e.is_live);
  const upcomingEvents = events.filter(e => !e.is_live && e.status !== 'completed');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📊 Bookmaker Panel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Events List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-dark-200">Events</h2>

          {liveEvents.length > 0 && (
            <div>
              <div className="text-xs text-red-400 font-semibold mb-1 flex items-center gap-1">
                <span className="live-pulse w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span> LIVE
              </div>
              {liveEvents.map(e => (
                <button key={e.id} onClick={() => selectEvent(e)}
                  className={`w-full text-left card p-3 mb-1 hover:border-primary-500/50 transition-colors ${selectedEvent?.id === e.id ? 'border-primary-500' : ''}`}>
                  <div className="text-sm font-medium text-white">{e.team_a} v {e.team_b}</div>
                  <div className="text-xs text-dark-400">{e.sport_name}</div>
                </button>
              ))}
            </div>
          )}

          {upcomingEvents.length > 0 && (
            <div>
              <div className="text-xs text-dark-400 font-semibold mb-1">UPCOMING</div>
              {upcomingEvents.map(e => (
                <button key={e.id} onClick={() => selectEvent(e)}
                  className={`w-full text-left card p-3 mb-1 hover:border-primary-500/50 transition-colors ${selectedEvent?.id === e.id ? 'border-primary-500' : ''}`}>
                  <div className="text-sm font-medium text-white">{e.team_a} v {e.team_b}</div>
                  <div className="text-xs text-dark-400">{e.sport_name} - {new Date(e.start_time).toLocaleString('en-IN')}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Markets */}
        <div className="lg:col-span-2 space-y-3">
          {selectedEvent ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-dark-200">{selectedEvent.team_a} v {selectedEvent.team_b}</h2>
                <button onClick={() => loadMarkets(selectedEvent.id)} className="text-xs text-primary-400">Refresh</button>
              </div>

              {markets.map(market => (
                <div key={market.id} className="card">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-dark-700">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{market.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${market.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {market.status.toUpperCase()}
                      </span>
                    </div>
                    <button onClick={() => toggleMarket(market.id, market.status)}
                      className={`text-xs px-3 py-1 rounded ${market.status === 'open' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {market.status === 'open' ? 'Suspend' : 'Open'}
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {market.runners?.map(runner => (
                      <div key={runner.id} className="flex items-center gap-3 bg-dark-900 rounded-lg p-3">
                        <div className="flex-1 font-medium text-sm text-dark-200">{runner.name}</div>
                        <div className="flex gap-2">
                          <div>
                            <label className="text-[10px] text-back-dark block text-center">BACK</label>
                            <input type="number" step="0.01" className="w-16 bg-back/10 border border-back/30 text-back-dark text-center rounded py-1 text-sm font-bold"
                              defaultValue={parseFloat(runner.back_price).toFixed(2)}
                              onBlur={e => updateOdds(runner.id, 'back_price', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-lay-dark block text-center">LAY</label>
                            <input type="number" step="0.01" className="w-16 bg-lay/10 border border-lay/30 text-lay-dark text-center rounded py-1 text-sm font-bold"
                              defaultValue={parseFloat(runner.lay_price).toFixed(2)}
                              onBlur={e => updateOdds(runner.id, 'lay_price', e.target.value)} />
                          </div>
                          <div>
                            <label className="text-[10px] text-dark-400 block text-center">SIZE</label>
                            <input type="number" className="w-20 bg-dark-800 border border-dark-600 text-dark-300 text-center rounded py-1 text-sm"
                              defaultValue={parseInt(runner.back_size)}
                              onBlur={e => updateOdds(runner.id, 'back_size', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-10 text-dark-400">Select an event to manage markets</div>
          )}

          {/* Active Bets */}
          <div className="card">
            <div className="px-4 py-2 border-b border-dark-700">
              <h3 className="font-semibold text-sm text-white">Active Bets ({allBets.length})</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {allBets.map(bet => (
                <div key={bet.id} className="px-4 py-2 border-b border-dark-700/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-dark-200">{bet.username}</span>
                    <span className="text-dark-400 ml-2">{bet.runner_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${bet.bet_type === 'back' ? 'bg-back/20 text-back-dark' : 'bg-lay/20 text-lay-dark'}`}>
                      {bet.bet_type.toUpperCase()}
                    </span>
                    <span className="text-dark-300">@{parseFloat(bet.odds).toFixed(2)}</span>
                    <span className="text-dark-200 font-medium">₹{parseFloat(bet.stake).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
              {allBets.length === 0 && <div className="text-center py-4 text-dark-400 text-xs">No active bets</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
