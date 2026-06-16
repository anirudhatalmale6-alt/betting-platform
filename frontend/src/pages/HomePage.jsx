import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

const CASINO_PROVIDERS = [
  { name: 'Ezugi', color: 'from-pink-500 to-pink-700', icon: '🎰' },
  { name: 'Evolution', color: 'from-orange-500 to-red-600', icon: '🃏' },
  { name: 'Turbo Games', color: 'from-blue-500 to-cyan-600', icon: '⚡' },
  { name: 'JILI', color: 'from-orange-400 to-orange-600', icon: '🎮' },
  { name: 'Spribe', color: 'from-purple-500 to-purple-700', icon: '📈' },
  { name: 'SmartSoft', color: 'from-blue-600 to-blue-800', icon: '🎲' },
  { name: 'Bombay Live', color: 'from-red-600 to-red-800', icon: '🇮🇳' },
  { name: 'Kingmaker', color: 'from-yellow-600 to-orange-600', icon: '👑' },
  { name: 'Virtual Games', color: 'from-green-500 to-emerald-700', icon: '🖥️' },
  { name: 'Bikini Games', color: 'from-pink-400 to-rose-600', icon: '🎪' },
];

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const sportFilter = searchParams.get('sport');
  const inplay = searchParams.get('inplay');
  const socket = useSocket();

  useEffect(() => { loadEvents(); }, [sportFilter]);

  useEffect(() => {
    if (!socket) return;
    socket.on('odds_update', (data) => {
      setEvents(prev => prev.map(ev => ev.id === data.event_id ? { ...ev, _oddsUpdate: data.runners } : ev));
    });
    socket.on('score_update', (data) => {
      setEvents(prev => prev.map(ev => ev.id === data.event_id ? { ...ev, score_a: data.score_a, score_b: data.score_b } : ev));
    });
    return () => { socket.off('odds_update'); socket.off('score_update'); };
  }, [socket]);

  const loadEvents = async () => {
    try {
      const params = {};
      if (sportFilter) params.sport_id = sportFilter;
      const { data } = await eventsAPI.getEvents(params);
      setEvents(data);
    } catch (e) {}
    setLoading(false);
  };

  const liveEvents = events.filter(e => e.is_live);
  const upcomingEvents = events.filter(e => !e.is_live && e.status !== 'completed');
  const displayLive = inplay ? liveEvents : liveEvents;
  const displayUpcoming = inplay ? [] : upcomingEvents;

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-2">
      {/* Casino Providers Banner */}
      {!sportFilter && !inplay && (
        <div className="card">
          <div className="section-header">🎰 CASINO PROVIDER</div>
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-0.5 p-1 bg-gray-100">
            {CASINO_PROVIDERS.map(prov => (
              <Link key={prov.name} to="/casino" className={`bg-gradient-to-br ${prov.color} rounded p-3 text-center hover:scale-105 transition-transform`}>
                <div className="text-2xl mb-1">{prov.icon}</div>
                <div className="text-white text-[9px] font-bold leading-tight">{prov.name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Live Events */}
      {displayLive.length > 0 && (
        <div className="card">
          <div className="section-header">
            <span className="live-pulse w-2 h-2 bg-red-400 rounded-full inline-block"></span>
            LIVE EVENTS ({displayLive.length})
          </div>
          {/* Column header */}
          <div className="hidden sm:flex items-center bg-gray-100 px-3 py-1 text-[10px] text-gray-500 font-semibold border-b">
            <div className="flex-1">Event</div>
            <div className="w-[132px] flex text-center">
              <span className="w-[66px] text-back-dark">BACK</span>
              <span className="w-[66px] text-lay-dark">LAY</span>
            </div>
          </div>
          {displayLive.map(event => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Upcoming Events */}
      {displayUpcoming.length > 0 && (
        <div className="card">
          <div className="section-header-green">📅 UPCOMING EVENTS</div>
          {displayUpcoming.map(event => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}

      {events.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🏏</div>
          <div className="text-gray-500">No events available right now</div>
          <div className="text-gray-400 text-sm mt-1">Check back soon for live matches!</div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }) {
  const startTime = new Date(event.start_time);
  const timeStr = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = startTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const sportIcons = { cricket: '🏏', football: '⚽', tennis: '🎾' };

  return (
    <Link to={`/event/${event.id}`} className="flex items-center px-3 py-2 border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
      {/* Event Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{sportIcons[event.sport_slug] || '🏅'}</span>
          <span className="text-[10px] text-gray-400 truncate">{event.tournament_name}</span>
          {event.is_live ? (
            <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-red-100 rounded text-[10px] text-red-600 font-bold">
              <span className="live-pulse w-1 h-1 bg-red-500 rounded-full inline-block"></span>LIVE
            </span>
          ) : (
            <span className="ml-auto text-[10px] text-gray-400">{dateStr} {timeStr}</span>
          )}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800 truncate">{event.team_a}</span>
            {event.is_live && event.score_a !== '0' && (
              <span className="text-xs text-blue-600 font-mono font-bold ml-2 shrink-0">{event.score_a}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800 truncate">{event.team_b}</span>
            {event.is_live && event.score_b !== '0' && (
              <span className="text-xs text-blue-600 font-mono font-bold ml-2 shrink-0">{event.score_b}</span>
            )}
          </div>
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{event.open_markets || 0} markets</div>
      </div>

      {/* Back/Lay boxes */}
      <div className="flex gap-0.5 ml-2">
        <div className="back-btn w-[64px] py-2 rounded text-center">
          <div className="text-xs font-bold">-</div>
        </div>
        <div className="lay-btn w-[64px] py-2 rounded text-center">
          <div className="text-xs font-bold">-</div>
        </div>
      </div>
    </Link>
  );
}
