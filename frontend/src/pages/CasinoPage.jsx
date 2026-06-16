import { useState, useEffect } from 'react';
import { casinoAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const GAME_ICONS = {
  'teen-patti': '🃏', 'andar-bahar': '🎴', 'lucky-7': '🍀', 'dragon-tiger': '🐉',
  'thirty-two-cards': '♠️', 'roulette': '🎰', 'baccarat': '🂡', 'hi-lo': '⬆️',
  'crash': '📈', 'bollywood-casino': '🎬', 'worli-matka': '🎯', 'coin-toss': '🪙',
  'card-war': '⚔️', 'poker': '♦️', 'jhandi-munda': '🎲'
};

const GAME_COLORS = {
  'indian_games': 'from-orange-600 to-red-700',
  'live_casino': 'from-purple-600 to-pink-700',
  'table_games': 'from-emerald-600 to-teal-700',
  'crash': 'from-yellow-600 to-orange-700',
  'instant': 'from-blue-600 to-indigo-700'
};

const GAME_OPTIONS = {
  'teen-patti': [{ name: 'Player A', odds: 1.98 }, { name: 'Player B', odds: 1.98 }, { name: 'Tie', odds: 8.0 }],
  'andar-bahar': [{ name: 'Andar', odds: 1.95 }, { name: 'Bahar', odds: 1.95 }],
  'lucky-7': [{ name: 'Low (1-6)', odds: 2.1 }, { name: 'Lucky 7', odds: 5.0 }, { name: 'High (8-13)', odds: 2.1 }],
  'dragon-tiger': [{ name: 'Dragon', odds: 1.95 }, { name: 'Tiger', odds: 1.95 }, { name: 'Tie', odds: 8.0 }],
  'thirty-two-cards': [{ name: 'Player 8', odds: 1.85 }, { name: 'Player 9', odds: 1.85 }, { name: 'Player 10', odds: 3.5 }, { name: 'Player 11', odds: 3.5 }],
  'roulette': [{ name: 'Red', odds: 2.0 }, { name: 'Black', odds: 2.0 }, { name: 'Green (0)', odds: 36.0 }],
  'baccarat': [{ name: 'Player', odds: 2.0 }, { name: 'Banker', odds: 1.95 }, { name: 'Tie', odds: 8.0 }],
  'hi-lo': [{ name: 'High', odds: 1.95 }, { name: 'Low', odds: 1.95 }],
  'crash': [{ name: '1.5x', odds: 1.5 }, { name: '2x', odds: 2.0 }, { name: '5x', odds: 5.0 }, { name: '10x', odds: 10.0 }],
  'bollywood-casino': [{ name: 'Card A', odds: 1.95 }, { name: 'Card B', odds: 1.95 }],
  'worli-matka': [{ name: 'Open', odds: 9.0 }, { name: 'Close', odds: 9.0 }, { name: 'Jodi', odds: 90.0 }],
  'coin-toss': [{ name: 'Heads', odds: 1.98 }, { name: 'Tails', odds: 1.98 }],
  'card-war': [{ name: 'Red', odds: 1.98 }, { name: 'Black', odds: 1.98 }],
  'poker': [{ name: 'Player', odds: 2.0 }, { name: 'Dealer', odds: 2.0 }, { name: 'Tie', odds: 10.0 }],
  'jhandi-munda': [{ name: 'Jhandi', odds: 1.95 }, { name: 'Munda', odds: 1.95 }]
};

export default function CasinoPage() {
  const [games, setGames] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [stake, setStake] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [history, setHistory] = useState([]);
  const [category, setCategory] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const { user, refreshProfile } = useAuth();

  useEffect(() => { loadGames(); }, [category]);

  const loadGames = async () => {
    try {
      const params = {};
      if (category) params.category = category;
      const { data } = await casinoAPI.getGames(params);
      setGames(data);
    } catch (e) {}
  };

  const loadHistory = async () => {
    if (!user) return;
    try { const { data } = await casinoAPI.getHistory({ limit: 20 }); setHistory(data); } catch (e) {}
  };

  const playGame = async () => {
    if (!user) return toast.error('Please login to play');
    if (user.role !== 'player') return toast.error('Only players can play');
    if (!selectedOption || !stake) return toast.error('Select option and enter stake');
    setPlacing(true);
    setLastResult(null);
    try {
      const { data } = await casinoAPI.placeBet({
        game_id: activeGame.id, bet_option: selectedOption.name,
        stake: parseFloat(stake), odds: selectedOption.odds
      });
      setLastResult(data);
      if (data.result === 'won') {
        toast.success(`WON +₹${data.profit_loss.toLocaleString('en-IN')}`);
      } else {
        toast.error(`Lost ₹${Math.abs(data.profit_loss).toLocaleString('en-IN')}`);
      }
      refreshProfile();
      loadHistory();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    setPlacing(false);
  };

  const categories = [
    { key: null, label: 'All Games', icon: '🎮' },
    { key: 'indian_games', label: 'Indian', icon: '🇮🇳' },
    { key: 'live_casino', label: 'Live Casino', icon: '🎰' },
    { key: 'table_games', label: 'Table', icon: '🃏' },
    { key: 'crash', label: 'Crash', icon: '📈' },
    { key: 'instant', label: 'Instant', icon: '⚡' }
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="card">
        <div className="section-header justify-between">
          <span>🎰 CASINO</span>
          {user && (
            <button onClick={loadHistory} className="text-xs bg-white/20 px-2 py-0.5 rounded hover:bg-white/30">📋 History</button>
          )}
        </div>
        <div className="bg-gradient-to-r from-purple-700 via-brand-700 to-orange-700 p-3 text-center">
          <div className="text-white font-black text-lg">Play Instant Games - Win Real Money!</div>
          <div className="text-white/70 text-xs mt-0.5">15+ Games Available 24/7</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.key || 'all'}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
              category === cat.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => { setActiveGame(game); setSelectedOption(null); setStake(''); setLastResult(null); loadHistory(); }}
            className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-md transition-all hover:scale-[1.02]"
          >
            {/* Game Visual */}
            <div className={`bg-gradient-to-br ${GAME_COLORS[game.category] || 'from-gray-600 to-gray-800'} h-24 flex items-center justify-center relative`}>
              <span className="text-5xl filter drop-shadow-lg group-hover:scale-110 transition-transform">{GAME_ICONS[game.slug] || '🎮'}</span>
              <div className="absolute top-1 right-1 bg-black/40 px-1.5 py-0.5 rounded text-[9px] text-white font-bold">LIVE</div>
            </div>
            {/* Game Info */}
            <div className="p-2">
              <div className="font-bold text-xs text-gray-800 truncate">{game.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">₹{game.min_bet} - ₹{parseInt(game.max_bet).toLocaleString()}</div>
            </div>
          </button>
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-12 text-dark-400">
          <div className="text-4xl mb-2">🎰</div>
          <div className="text-sm">No games in this category</div>
        </div>
      )}

      {/* Game Play Modal */}
      {activeGame && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setActiveGame(null)}>
          <div className="bg-white w-full max-w-md rounded-t-xl sm:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Game Header */}
            <div className={`bg-gradient-to-br ${GAME_COLORS[activeGame.category] || 'from-gray-600 to-gray-800'} p-4 rounded-t-xl flex justify-between items-start`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{GAME_ICONS[activeGame.slug] || '🎮'}</span>
                <div>
                  <h3 className="font-black text-white text-lg">{activeGame.name}</h3>
                  <div className="text-white/70 text-xs">{activeGame.category.replace('_', ' ').toUpperCase()}</div>
                </div>
              </div>
              <button onClick={() => setActiveGame(null)} className="text-white/50 hover:text-white text-xl font-bold">&times;</button>
            </div>

            <div className="p-4 space-y-3">
              {/* Last Result */}
              {lastResult && (
                <div className={`p-3 rounded border text-center ${
                  lastResult.result === 'won'
                    ? 'bg-accent-green/10 border-accent-green/30'
                    : 'bg-accent-red/10 border-accent-red/30'
                }`}>
                  <div className={`text-lg font-black ${lastResult.result === 'won' ? 'text-accent-green' : 'text-accent-red'}`}>
                    {lastResult.result === 'won' ? `WON +₹${lastResult.profit_loss.toLocaleString('en-IN')}` : `LOST -₹${Math.abs(lastResult.profit_loss).toLocaleString('en-IN')}`}
                  </div>
                  <div className="text-xs text-dark-400 mt-0.5">Balance: ₹{parseFloat(lastResult.new_balance).toLocaleString('en-IN')}</div>
                </div>
              )}

              {/* Options */}
              <div>
                <label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">SELECT OPTION</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(GAME_OPTIONS[activeGame.slug] || [{ name: 'Win', odds: 2.0 }, { name: 'Lose', odds: 2.0 }]).map(opt => (
                    <button
                      key={opt.name}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-2.5 rounded border text-center transition-all ${
                        selectedOption?.name === opt.name
                          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/50'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="font-bold text-sm text-gray-800">{opt.name}</div>
                      <div className="text-brand-600 text-xs font-bold mt-0.5">{opt.odds}x</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake */}
              <div>
                <label className="text-[10px] text-gray-500 font-semibold mb-1 block">STAKE (₹)</label>
                <input type="number" className="input-field text-center font-bold" value={stake} onChange={e => setStake(e.target.value)} placeholder="Enter amount" />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(amt => (
                  <button key={amt} onClick={() => setStake(String(amt))} className="bg-gray-100 hover:bg-gray-200 border rounded py-1.5 text-[11px] font-bold text-gray-700">
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              {/* Potential Win */}
              {selectedOption && stake && parseFloat(stake) > 0 && (
                <div className="bg-gray-50 rounded p-2.5 border flex justify-between items-center">
                  <span className="text-xs text-dark-400">Potential Win</span>
                  <span className="text-accent-green font-black">+₹{(parseFloat(stake) * (selectedOption.odds - 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              )}

              <button
                onClick={playGame}
                disabled={placing || !selectedOption || !stake || parseFloat(stake) <= 0}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 rounded font-black text-white text-sm transition-all disabled:opacity-50"
              >
                {placing ? '🎲 PLAYING...' : '🎲 PLAY NOW'}
              </button>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-500 font-semibold mb-1.5">RECENT RESULTS</div>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {history.slice(0, 8).map(bet => (
                      <div key={bet.id} className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${bet.status === 'won' ? 'bg-accent-green' : 'bg-accent-red'}`}></span>
                          <span className="text-gray-600">{bet.game_name}</span>
                          <span className="text-gray-400">{bet.bet_option}</span>
                        </div>
                        <span className={`font-bold ${bet.status === 'won' ? 'text-accent-green' : 'text-accent-red'}`}>
                          {bet.status === 'won' ? '+' : '-'}₹{Math.abs(parseFloat(bet.profit_loss)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
