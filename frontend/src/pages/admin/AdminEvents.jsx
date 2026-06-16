import { useState, useEffect } from 'react';
import { eventsAPI, betsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettle, setShowSettle] = useState(null);
  const [sports, setSports] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [form, setForm] = useState({ sport_id: '1', tournament_id: '', team_a: '', team_b: '', start_time: '' });

  useEffect(() => {
    loadEvents();
    loadSports();
  }, []);

  const loadEvents = async () => {
    try {
      const { data } = await eventsAPI.getEvents({});
      setEvents(data);
    } catch (e) {}
  };

  const loadSports = async () => {
    try {
      const { data } = await eventsAPI.getSports();
      setSports(data);
    } catch (e) {}
  };

  const loadTournaments = async (sportId) => {
    try {
      const { data } = await eventsAPI.getTournaments(sportId);
      setTournaments(data);
    } catch (e) {}
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      await eventsAPI.createEvent({ ...form, name: `${form.team_a} v ${form.team_b}` });
      toast.success('Event created');
      setShowCreate(false);
      loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const toggleLive = async (event) => {
    try {
      const newLive = event.is_live ? 0 : 1;
      await eventsAPI.updateEvent(event.id, { is_live: newLive, status: newLive ? 'live' : 'upcoming' });
      toast.success(newLive ? 'Event is now LIVE' : 'Event paused');
      loadEvents();
    } catch (e) { toast.error('Failed'); }
  };

  const updateScore = async (eventId, field, value) => {
    try {
      await eventsAPI.updateEvent(eventId, { [field]: value });
      toast.success('Score updated');
      loadEvents();
    } catch (e) { toast.error('Failed'); }
  };

  const settleEvent = async (eventId, winnerId) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;
      const { data: detail } = await eventsAPI.getEventDetail(eventId);
      for (const market of detail.markets) {
        if (market.status === 'open' || market.status === 'suspended') {
          const winnerRunner = market.runners.find(r => r.id === winnerId) || market.runners[0];
          await betsAPI.settleMarket({ market_id: market.id, winner_runner_id: winnerRunner.id });
        }
      }
      await eventsAPI.updateEvent(eventId, { status: 'completed', is_live: 0 });
      toast.success('Event settled');
      setShowSettle(null);
      loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🏏 Events</h1>
        <button onClick={() => { setShowCreate(true); loadTournaments(1); }} className="btn-primary text-sm">+ Create Event</button>
      </div>

      <div className="space-y-2">
        {events.map(event => (
          <div key={event.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {event.is_live ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                    <span className="live-pulse w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span> LIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">{event.status}</span>
                )}
                <span className="text-xs text-dark-400">{event.sport_name} - {event.tournament_name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleLive(event)} className={`text-xs px-3 py-1 rounded ${event.is_live ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {event.is_live ? 'Stop Live' : 'Go Live'}
                </button>
                {event.status !== 'completed' && (
                  <button onClick={() => setShowSettle(event)} className="text-xs px-3 py-1 rounded bg-yellow-500/20 text-yellow-400">Settle</button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{event.team_a} <span className="text-primary-400 text-sm ml-2">{event.score_a !== '0' ? event.score_a : ''}</span></div>
                <div className="font-semibold text-white">{event.team_b} <span className="text-primary-400 text-sm ml-2">{event.score_b !== '0' ? event.score_b : ''}</span></div>
              </div>
              <div className="text-xs text-dark-400">{new Date(event.start_time).toLocaleString('en-IN')}</div>
            </div>
            {event.is_live && (
              <div className="mt-3 pt-3 border-t border-dark-700 flex gap-2">
                <input type="text" placeholder="Score A" className="input-field text-xs flex-1" defaultValue={event.score_a !== '0' ? event.score_a : ''}
                  onBlur={e => e.target.value && updateScore(event.id, 'score_a', e.target.value)} />
                <input type="text" placeholder="Score B" className="input-field text-xs flex-1" defaultValue={event.score_b !== '0' ? event.score_b : ''}
                  onBlur={e => e.target.value && updateScore(event.id, 'score_b', e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-600 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Create Event</h3>
            <form onSubmit={createEvent} className="space-y-3">
              <select className="input-field" value={form.sport_id} onChange={e => { setForm({ ...form, sport_id: e.target.value }); loadTournaments(e.target.value); }}>
                {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="input-field" value={form.tournament_id} onChange={e => setForm({ ...form, tournament_id: e.target.value })}>
                <option value="">Select Tournament</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="text" placeholder="Team A" className="input-field" value={form.team_a} onChange={e => setForm({ ...form, team_a: e.target.value })} required />
              <input type="text" placeholder="Team B" className="input-field" value={form.team_b} onChange={e => setForm({ ...form, team_b: e.target.value })} required />
              <input type="datetime-local" className="input-field" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="bg-dark-700 px-4 py-2 rounded-lg text-dark-300 flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {showSettle && (
        <SettleModal event={showSettle} onClose={() => setShowSettle(null)} onSettle={settleEvent} />
      )}
    </div>
  );
}

function SettleModal({ event, onClose, onSettle }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    eventsAPI.getEventDetail(event.id).then(({ data }) => setDetail(data));
  }, [event.id]);

  if (!detail) return null;

  const matchOddsMarket = detail.markets.find(m => m.market_type === 'match_odds');
  if (!matchOddsMarket) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-2xl w-full max-w-sm border border-dark-600 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-2">Settle Event</h3>
        <p className="text-sm text-dark-400 mb-4">{event.name}</p>
        <p className="text-sm text-dark-300 mb-3">Select the winner:</p>
        <div className="space-y-2">
          {matchOddsMarket.runners.map(runner => (
            <button key={runner.id} onClick={() => onSettle(event.id, runner.id)}
              className="w-full p-3 bg-dark-700 hover:bg-dark-600 rounded-lg text-left font-medium text-white transition-colors">
              {runner.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2 bg-dark-700 rounded-lg text-dark-300 text-sm">Cancel</button>
      </div>
    </div>
  );
}
