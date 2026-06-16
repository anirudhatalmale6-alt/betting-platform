import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/'); };

  const sports = [
    { icon: '🏏', name: 'Cricket', path: '/?sport=1' },
    { icon: '⚽', name: 'Football', path: '/?sport=2' },
    { icon: '🎾', name: 'Tennis', path: '/?sport=3' },
  ];

  const sp = new URLSearchParams(location.search);
  const currentSport = sp.get('sport');

  return (
    <div className="min-h-screen bg-surface-light">
      {/* Top Dark Header */}
      <header className="bg-dark-900 sticky top-0 z-50">
        <div className="flex items-center justify-between px-3 h-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-xl font-black">
              <span className="text-brand-500">BETTING</span><span className="text-white">PRO</span>
            </div>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input type="text" placeholder="Search Events..." className="w-full bg-dark-800 border border-dark-700 text-white text-sm px-3 py-1.5 rounded pr-8" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400">🔍</span>
            </div>
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            <Link to="/rules" className="hidden sm:block bg-brand-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-brand-700">RULES</Link>

            {user ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 bg-dark-800 px-2.5 py-1.5 rounded border border-dark-700">
                  <span className="text-white text-xs font-semibold">{user.username}</span>
                  <span className="text-yellow-400 text-xs font-bold">₹{parseFloat(user.balance || 0).toLocaleString('en-IN')}</span>
                  <svg className="w-3 h-3 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border rounded shadow-lg py-1 z-50" onClick={() => setShowUserMenu(false)}>
                    <div className="px-3 py-2 border-b bg-gray-50">
                      <div className="font-bold text-sm">{user.full_name || user.username}</div>
                      <div className="text-xs text-gray-500">{user.role.toUpperCase()}</div>
                      <div className="flex gap-3 mt-1 text-xs">
                        <span>Bal: <span className="text-green-600 font-bold">₹{parseFloat(user.balance || 0).toLocaleString('en-IN')}</span></span>
                        <span>Exp: <span className="text-red-600 font-bold">₹{parseFloat(user.exposure || 0).toLocaleString('en-IN')}</span></span>
                      </div>
                    </div>
                    <Link to="/account" className="block px-3 py-2 text-sm hover:bg-gray-100">👤 My Account</Link>
                    <Link to="/my-bets" className="block px-3 py-2 text-sm hover:bg-gray-100">📋 My Bets</Link>
                    {user.role === 'admin' && <Link to="/admin" className="block px-3 py-2 text-sm hover:bg-gray-100 text-brand-600 font-semibold">⚙️ Admin Panel</Link>}
                    {user.role === 'bookmaker' && <Link to="/bookmaker" className="block px-3 py-2 text-sm hover:bg-gray-100 text-brand-600 font-semibold">📊 Bookmaker</Link>}
                    <div className="border-t mt-1 pt-1">
                      <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100">🚪 Logout</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/login')} className="bg-dark-700 text-white px-3 py-1.5 rounded text-xs font-bold border border-dark-600 hover:bg-dark-600">SIGNUP</button>
                <button onClick={() => navigate('/login')} className="bg-yellow-500 text-dark-900 px-3 py-1.5 rounded text-xs font-black hover:bg-yellow-400">LOGIN</button>
              </div>
            )}

            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-white p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Nav Bar - Crimson */}
        <nav className="bg-brand-800 flex items-center px-2 overflow-x-auto">
          <Link to="/" className={`flex items-center gap-1 px-3 py-2 text-xs font-bold transition-colors ${
            location.pathname === '/' && !currentSport ? 'bg-brand-900 text-white' : 'text-white/80 hover:text-white hover:bg-brand-900/50'
          }`}>
            <span>🏠</span> HOME
          </Link>
          <Link to="/?inplay=1" className={`flex items-center gap-1 px-3 py-2 text-xs font-bold text-white/80 hover:text-white hover:bg-brand-900/50`}>
            <span>📺</span> IN-PLAY
          </Link>
          {sports.map(s => (
            <Link key={s.name} to={s.path} className={`flex items-center gap-1 px-3 py-2 text-xs font-bold transition-colors ${
              currentSport === s.path.split('=')[1] ? 'bg-brand-900 text-white' : 'text-white/80 hover:text-white hover:bg-brand-900/50'
            }`}>
              <span>{s.icon}</span> {s.name}
            </Link>
          ))}
          <Link to="/casino" className={`flex items-center gap-1 px-3 py-2 text-xs font-bold transition-colors ${
            location.pathname === '/casino' ? 'bg-brand-900 text-white' : 'text-white/80 hover:text-white hover:bg-brand-900/50'
          }`}>
            <span>🎰</span> Casino
          </Link>
        </nav>
      </header>

      {/* Marquee */}
      <div className="bg-dark-800 border-b border-dark-700 overflow-hidden py-0.5">
        <div className="marquee whitespace-nowrap text-xs text-yellow-400 font-medium">
          ⚡ Welcome to BettingPro - India's Most Trusted Exchange | Live Cricket, Football & Tennis | 24/7 Casino | Instant Withdrawal | IPL 2026 Special Offers! ⚡
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex">
        {/* Left Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-[240px] shrink-0 bg-surface-light`}>
          {/* Promo Banner */}
          <div className="bg-gradient-to-b from-dark-900 to-brand-900 p-4 text-center">
            <div className="text-4xl mb-2">🎰🎲🃏</div>
            <div className="text-white font-black text-sm">LIVE CASINO</div>
            <div className="text-yellow-400 text-xs mt-1">Play & Win Big!</div>
          </div>

          {/* Sports Menu */}
          <div className="bg-white border-b">
            <div className="section-header">🏆 SPORTS</div>
            {sports.map(s => (
              <Link key={s.name} to={s.path} className={`flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                currentSport === s.path.split('=')[1] ? 'bg-blue-50 text-brand-600 font-semibold' : 'text-gray-700'
              }`}>
                <span>{s.icon}</span> {s.name}
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          {user && (
            <div className="bg-white border-b">
              <div className="section-header">📋 QUICK LINKS</div>
              <Link to="/my-bets" className="flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100 hover:bg-blue-50 text-gray-700">
                📋 My Bets
              </Link>
              <Link to="/account" className="flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100 hover:bg-blue-50 text-gray-700">
                👤 Account
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100 hover:bg-blue-50 text-brand-600 font-semibold">
                  ⚙️ Admin Panel
                </Link>
              )}
              {user.role === 'bookmaker' && (
                <Link to="/bookmaker" className="flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100 hover:bg-blue-50 text-brand-600 font-semibold">
                  📊 Bookmaker
                </Link>
              )}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-2">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-dark-900 py-4 mt-4">
        <div className="text-center">
          <div className="text-brand-500 font-black text-lg">BETTING<span className="text-white">PRO</span></div>
          <div className="text-dark-400 text-xs mt-1">Play Responsibly | 18+ Only | &copy; 2026</div>
        </div>
      </footer>
    </div>
  );
}
