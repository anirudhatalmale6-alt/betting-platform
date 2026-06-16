import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sportTabs = [
    { path: '/', label: 'Cricket', icon: '🏏', sport: null },
    { path: '/?sport=1', label: 'Cricket', icon: '🏏', sport: '1', hidden: true },
    { path: '/?sport=2', label: 'Football', icon: '⚽', sport: '2' },
    { path: '/?sport=3', label: 'Tennis', icon: '🎾', sport: '3' },
    { path: '/casino', label: 'Casino', icon: '🎰' },
  ];

  const sp = new URLSearchParams(location.search);
  const currentSport = sp.get('sport');

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Top Gold Marquee */}
      <div className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border-b border-primary-700/30">
        <div className="overflow-hidden py-1">
          <div className="marquee whitespace-nowrap text-xs text-primary-400 font-medium">
            ⚡ Welcome to BettingPro - India's #1 Exchange | Live Cricket Satta | Football & Tennis | 24/7 Casino | Instant Withdrawal | WhatsApp Support Available ⚡ IPL 2026 Special Rates! ⚡
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-dark-900 to-dark-800 border-b border-dark-700 sticky top-0 z-50">
        <div className="px-3">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex items-center justify-center font-black text-dark-900 text-sm">BP</div>
              <div className="hidden sm:block">
                <div className="text-base font-black leading-tight text-white">BETTING<span className="text-primary-400">PRO</span></div>
                <div className="text-[9px] text-primary-400/70 -mt-0.5">EXCHANGE</div>
              </div>
            </Link>

            {/* Center: Balance for logged in */}
            {user && (
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div className="bg-dark-700/50 px-3 py-1.5 rounded border border-dark-600">
                  <span className="text-dark-400">Balance: </span>
                  <span className="text-accent-green font-bold">₹{parseFloat(user.balance || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-dark-700/50 px-3 py-1.5 rounded border border-dark-600">
                  <span className="text-dark-400">Exposure: </span>
                  <span className="text-danger font-bold">₹{parseFloat(user.exposure || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Right */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 bg-dark-700 px-2.5 py-1.5 rounded border border-dark-600 hover:border-primary-500/50">
                    <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-bold text-xs">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-white leading-tight">{user.username}</div>
                      <div className="text-[10px] text-primary-400">{user.role.toUpperCase()}</div>
                    </div>
                    <svg className="w-3 h-3 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-1 w-52 bg-dark-800 border border-dark-600 rounded shadow-2xl py-1 z-50" onClick={() => setShowUserMenu(false)}>
                      <div className="px-3 py-2 border-b border-dark-700">
                        <div className="font-bold text-sm text-white">{user.full_name || user.username}</div>
                        <div className="text-xs text-dark-400 mt-1">Bal: <span className="text-accent-green">₹{parseFloat(user.balance || 0).toLocaleString('en-IN')}</span></div>
                        <div className="text-xs text-dark-400">Exp: <span className="text-danger">₹{parseFloat(user.exposure || 0).toLocaleString('en-IN')}</span></div>
                      </div>
                      <Link to="/account" className="block px-3 py-2 text-sm hover:bg-dark-700 text-dark-200">👤 My Account</Link>
                      <Link to="/my-bets" className="block px-3 py-2 text-sm hover:bg-dark-700 text-dark-200">📋 My Bets</Link>
                      {user.role === 'admin' && <Link to="/admin" className="block px-3 py-2 text-sm hover:bg-dark-700 text-primary-400">⚙️ Admin Panel</Link>}
                      {user.role === 'bookmaker' && <Link to="/bookmaker" className="block px-3 py-2 text-sm hover:bg-dark-700 text-primary-400">📊 Bookmaker</Link>}
                      <div className="border-t border-dark-700 mt-1 pt-1">
                        <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-danger hover:bg-dark-700">🚪 Logout</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-xs px-4 py-2">LOGIN</Link>
              )}
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-dark-300 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Balance Bar */}
        {user && (
          <div className="md:hidden flex items-center gap-3 px-3 pb-2 text-xs">
            <div className="flex-1 bg-dark-700/50 px-2 py-1 rounded text-center">
              <span className="text-dark-400">Bal: </span><span className="text-accent-green font-bold">₹{parseFloat(user.balance || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex-1 bg-dark-700/50 px-2 py-1 rounded text-center">
              <span className="text-dark-400">Exp: </span><span className="text-danger font-bold">₹{parseFloat(user.exposure || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* Sport Tabs */}
        <div className="bg-dark-800/80 border-t border-dark-700/50">
          <div className="flex overflow-x-auto px-2">
            {sportTabs.filter(t => !t.hidden).map(tab => {
              const isActive = tab.path === '/casino'
                ? location.pathname === '/casino'
                : (location.pathname === '/' && (tab.sport === currentSport || (!tab.sport && !currentSport)));
              return (
                <Link
                  key={tab.label + (tab.sport || '')}
                  to={tab.path}
                  className={`sport-tab flex items-center gap-1.5 ${isActive ? 'sport-tab-active' : 'sport-tab-inactive'}`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.label === 'Cricket' && !tab.sport && <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse"></span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenu && (
          <div className="md:hidden border-t border-dark-700 py-2 px-3 bg-dark-800" onClick={() => setMobileMenu(false)}>
            <Link to="/my-bets" className="block py-2 text-sm text-dark-200">📋 My Bets</Link>
            <Link to="/account" className="block py-2 text-sm text-dark-200">👤 Account</Link>
            {user?.role === 'admin' && <Link to="/admin" className="block py-2 text-sm text-primary-400">⚙️ Admin Panel</Link>}
            {user?.role === 'bookmaker' && <Link to="/bookmaker" className="block py-2 text-sm text-primary-400">📊 Bookmaker</Link>}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-2 py-3 max-w-6xl mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-dark-700 py-4 mt-4">
        <div className="text-center space-y-2">
          <div className="text-primary-400 font-black text-lg">BETTING<span className="text-white">PRO</span></div>
          <div className="text-dark-500 text-xs">Play Responsibly | 18+ Only | BettingPro &copy; 2026</div>
        </div>
      </footer>
    </div>
  );
}
