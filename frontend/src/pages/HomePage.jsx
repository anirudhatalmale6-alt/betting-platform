import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const sportFilter = searchParams.get('sport');
  const socket = useSocket();

  useEffect(() => { loadEvents(); }, [sportFilter]);

  useEffect(() => {
    if (!socket) return;
    socket.on('odds_update', (data) => {
      setEvents(prev => prev.map(ev => {
        if (ev.id !== data.event_id) return ev;
        return { ...ev, _oddsUpdate: data.runners, _flash: Date.now() };
      }));
    });
    socket.on('score_update', (data) => {
      setEvents(prev => prev.map(ev =>
        ev.id === data.event_id ? { ...ev, score_a: data.score_a, score_b: data.score_b } : ev
      ));
    });
    return () => { socket.off('odds_update'); socket.off('score_update'); };
  }, [socket]);

  const loadEvents = async () => {
    try {
      const params = {};
      if (sportFilter) params.sport_id = sportFilter;
      const { data } = await eventsAPI.getEvents(params);
      setEvents(data);
    } catch (e) { console.error('Failed to load events'); }
    setLoading(false);
  };

  const liveEvents = events.filter(e => e.is_live);
  const upcomingEvents = events.filter(e => !e.is_live && e.status !== 'completed');

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {/* Live Events Section */}
      {liveEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-1 mb-2">
            <span className="live-pulse w-2 h-2 bg-accent-red rounded-full inline-block"></span>
            <span className="text-sm font-bold text-white uppercase tracking-wide">Live Events</span>
            <span className="text-xs text-dark-400">({liveEvents.length})</span>
          </div>

          {/* Column Headers */}
          <div className="hidden sm:flex items-center bg-dark-800 rounded-t border border-dark-700 px-3 py-1.5 text-[10px] text-dark-400 font-semibold uppercase">
            <div className="flex-1">Event</div>
            <div className="flex gap-0.5">
              <div className="w-[60px] text-center">1</div>
              <div className="w-[60px] text-center">X</div>
              <div className="w-[60px] text-center">2</div>
            </div>
          </div>

          <div className="space-y-0.5">
            {liveEvents.map((event, i) => (
              <EventRow key={event.id} event={event} isFirst={i === 0} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-1 mb-2 mt-4">
            <span className="text-sm font-bold text-dark-300 uppercase tracking-wide">Upcoming Events</span>
          </div>
          <div className="space-y-0.5">
            {upcomingEvents.map(event => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏏</div>
          <div className="text-dark-400">No events available right now</div>
          <div className="text-dark-500 text-sm mt-1">Check back soon for live matches!</div>
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
    <Link to={`/event/${event.id}`} className="block bg-dark-800 border border-dark-700 hover:border-primary-500/40 transition-all">
      <div className="flex items-stretch">
        {/* Left: Event Info */}
        <div className="flex-1 p-2.5 min-w-0">
          {/* Tournament */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm">{sportIcons[event.sport_slug] || '🏅'}</span>
            <span className="text-[10px] text-dark-500 truncate">{event.tournament_name}</span>
            {event.is_live ? (
              <span className="flex items-center gap-1 ml-auto px-1.5 py-0.5 bg-accent-red/20 rounded text-[10px] text-accent-red font-bold">
                <span className="live-pulse w-1 h-1 bg-accent-red rounded-full inline-block"></span>LIVE
              </span>
            ) : (
              <span className="ml-auto text-[10px] text-dark-500">{dateStr} {timeStr}</span>
            )}
          </div>

          {/* Teams */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate">{event.team_a}</span>
              {event.is_live && event.score_a !== '0' && (
                <span className="text-xs text-primary-400 font-mono font-bold ml-2 shrink-0">{event.score_a}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate">{event.team_b}</span>
              {event.is_live && event.score_b !== '0' && (
                <span className="text-xs text-primary-400 font-mono font-bold ml-2 shrink-0">{event.score_b}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-dark-500">{event.open_markets || 0} markets</span>
            {event.is_live && <span className="text-[10px] text-accent-green">● In-Play</span>}
          </div>
        </div>

        {/* Right: Back/Lay Odds Boxes */}
        <div className="flex items-center gap-0.5 pr-2 py-2">
          <div className="flex flex-col gap-0.5">
            <div className="text-[8px] text-center text-back-dark font-bold">BACK</div>
            <div className="back-btn w-[52px] sm:w-[60px] py-1.5 rounded text-center">
              <div className="text-xs font-bold">-</div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[8px] text-center text-lay-dark font-bold">LAY</div>
            <div className="lay-btn w-[52px] sm:w-[60px] py-1.5 rounded text-center">
              <div className="text-xs font-bold">-</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
