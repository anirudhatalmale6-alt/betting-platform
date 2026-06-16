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

  useEffect(() => {
    loadEvents();
  }, [sportFilter]);

  const loadEvents = async () => {
    try {
      const params = {};
      if (sportFilter) params.sport_id = sportFilter;
      const { data } = await eventsAPI.getEvents(params);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events');
    }
    setLoading(false);
  };

  const liveEvents = events.filter(e => e.is_live);
  const upcomingEvents = events.filter(e => !e.is_live && e.status !== 'completed');

  const sportIcons = { cricket: '🏏', football: '⚽', tennis: '🎾' };

  if (loading) return <div className="text-center py-20 text-dark-400">Loading events...</div>;

  return (
    <div className="space-y-6">
      {/* Live Events */}
      {liveEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="live-pulse inline-block w-2 h-2 bg-red-500 rounded-full"></span>
            <h2 className="text-lg font-bold text-white">LIVE NOW</h2>
            <span className="text-sm text-dark-400">({liveEvents.length} events)</span>
          </div>
          <div className="space-y-2">
            {liveEvents.map(event => (
              <EventCard key={event.id} event={event} sportIcons={sportIcons} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-3">UPCOMING</h2>
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} sportIcons={sportIcons} />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <div className="text-center py-20 text-dark-400">
          <p className="text-2xl mb-2">🏏</p>
          <p>No events available right now.</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, sportIcons }) {
  const startTime = new Date(event.start_time);
  const timeStr = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = startTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <Link to={`/event/${event.id}`} className="card block hover:border-primary-500/50 transition-colors">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>{sportIcons[event.sport_slug] || '🏅'}</span>
            <span className="text-xs text-dark-400">{event.tournament_name || event.sport_name}</span>
          </div>
          <div className="flex items-center gap-2">
            {event.is_live ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                <span className="live-pulse w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span> LIVE
              </span>
            ) : (
              <span className="text-xs text-dark-400">{dateStr} {timeStr}</span>
            )}
            {event.tv_channel && <span className="text-xs text-dark-500">📺 {event.tv_channel}</span>}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-white">{event.team_a}</span>
                {event.is_live && event.score_a !== '0' && (
                  <span className="ml-2 text-primary-400 text-sm font-mono">{event.score_a}</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">{event.team_b}</span>
                {event.is_live && event.score_b !== '0' && (
                  <span className="ml-2 text-primary-400 text-sm font-mono">{event.score_b}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mini Odds */}
          <div className="flex gap-1 ml-4">
            <div className="text-center">
              <div className="text-[10px] text-dark-400 mb-0.5">BACK</div>
              <div className="bg-back/20 text-back-dark px-3 py-1 rounded text-sm font-bold">-</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-dark-400 mb-0.5">LAY</div>
              <div className="bg-lay/20 text-lay-dark px-3 py-1 rounded text-sm font-bold">-</div>
            </div>
          </div>
        </div>

        {/* Markets count */}
        <div className="mt-2 pt-2 border-t border-dark-700">
          <span className="text-xs text-dark-400">{event.open_markets || 0} markets available</span>
        </div>
      </div>
    </Link>
  );
}
