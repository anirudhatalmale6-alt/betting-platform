import { useState, useEffect } from 'react';
import { casinoAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const GAME_EMOJIS = {
  'teen-patti': '🃏', 'andar-bahar': '🎴', 'lucky-7': '🍀', 'dragon-tiger': '🐉',
  'thirty-two-cards': '♠️', 'roulette': '🎰', 'baccarat': '🂡', 'hi-lo': '⬆️',
  'crash': '📈', 'bollywood-casino': '🎬'
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
  'bollywood-casino': [{ name: 'Card A', odds: 1.95 }, { name: 'Card B', odds: 1.95 }]
};

export default function CasinoPage() {
  const [games, setGames] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [stake, setStake] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [history, setHistory] = useState([]);
  const [category, setCategory] = useState(null);
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    loadGames();
  }, [category]);

  const loadGames = async () => {
    try {
      const params = {};
      if (category) params.category = category;
      const { data } = await casinoAPI.getGames(params);
      setGames(data);
    } catch (e) {
      console.error('Failed to load games');
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    try {
      const { data } = await casinoAPI.getHistory({ limit: 20 });
      setHistory(data);
    } catch (e) {}
  };

  const playGame = async () => {
    if (!user) return toast.error('Please login to play');
    if (user.role !== 'player') return toast.error('Only players can play');
    if (!selectedOption || !stake) return toast.error('Select an option and enter stake');
    setPlacing(true);
    try {
      const { data } = await casinoAPI.placeBet({
        game_id: activeGame.id,
        bet_option: selectedOption.name,
        stake: parseFloat(stake),
        odds: selectedOption.odds
      });
      if (data.result === 'won') {
        toast.success(`You Won! +₹${data.profit_loss.toLocaleString('en-IN')}`);
      } else {
        toast.error(`You Lost ₹${Math.abs(data.profit_loss).toLocaleString('en-IN')}`);
      }
      refreshProfile();
      loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place bet');
    }
    setPlacing(false);
  };

  const categories = [
    { key: null, label: 'All Games', icon: '🎮' },
    { key: 'indian_games', label: 'Indian', icon: '🇮🇳' },
    { key: 'live_casino', label: 'Live Casino', icon: '🎰' },
    { key: 'table_games', label: 'Table Games', icon: '🃏' },
    { key: 'crash', label: 'Crash', icon: '📈' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🎰 Casino</h1>
        {user && (
          <button onClick={loadHistory} className="text-sm text-primary-400 hover:text-primary-300">View History</button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.key || 'all'}
            onClick={() => setCategory(cat.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              category === cat.key ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => { setActiveGame(game); setSelectedOption(null); setStake(''); loadHistory(); }}
            className="card p-4 text-center hover:border-primary-500/50 transition-all hover:scale-[1.02]"
          >
            <div className="text-4xl mb-2">{GAME_EMOJIS[game.slug] || '🎮'}</div>
            <div className="font-semibold text-sm text-white">{game.name}</div>
            <div className="text-[10px] text-dark-400 mt-1">Min ₹{game.min_bet} - Max ₹{parseInt(game.max_bet).toLocaleString()}</div>
          </button>
        ))}
      </div>

      {/* Active Game Modal */}
      {activeGame && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setActiveGame(null)}>
          <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-600 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{GAME_EMOJIS[activeGame.slug] || '🎮'}</span>
                <div>
                  <h3 className="font-bold text-white">{activeGame.name}</h3>
                  <span className="text-xs text-dark-400">{activeGame.provider}</span>
                </div>
              </div>
              <button onClick={() => setActiveGame(null)} className="text-dark-400 hover:text-white text-xl">&times;</button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-dark-400 mb-2 block">Choose Option</label>
                <div className="grid grid-cols-2 gap-2">
                  {(GAME_OPTIONS[activeGame.slug] || [{ name: 'Win', odds: 2.0 }, { name: 'Lose', odds: 2.0 }]).map(opt => (
                    <button
                      key={opt.name}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        selectedOption?.name === opt.name
                          ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                          : 'border-dark-600 hover:border-dark-500 text-dark-200'
                      }`}
                    >
                      <div className="font-semibold text-sm">{opt.name}</div>
                      <div className="text-xs text-dark-400 mt-0.5">{opt.odds}x</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-1 block">Stake (₹)</label>
                <input type="number" className="input-field text-center font-bold text-lg" value={stake} onChange={e => setStake(e.target.value)} placeholder="0" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(amt => (
                  <button key={amt} onClick={() => setStake(String(amt))} className="bg-dark-700 hover:bg-dark-600 rounded py-1.5 text-xs font-medium text-dark-200">
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>

              {selectedOption && stake && parseFloat(stake) > 0 && (
                <div className="bg-dark-900 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Potential Win</span>
                    <span className="text-green-400 font-bold">₹{(parseFloat(stake) * (selectedOption.odds - 1)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <button
                onClick={playGame}
                disabled={placing || !selectedOption || !stake || parseFloat(stake) <= 0}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-xl font-bold text-white transition-colors disabled:opacity-50"
              >
                {placing ? 'Playing...' : 'Play Now'}
              </button>

              {/* Recent Results */}
              {history.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-dark-300 mb-2">Recent Results</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {history.slice(0, 10).map(bet => (
                      <div key={bet.id} className="flex items-center justify-between text-xs py-1 border-b border-dark-700/50">
                        <span className="text-dark-300">{bet.game_name} - {bet.bet_option}</span>
                        <span className={bet.status === 'won' ? 'text-green-400' : 'text-red-400'}>
                          {bet.status === 'won' ? '+' : ''}₹{parseFloat(bet.profit_loss).toLocaleString('en-IN')}
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
