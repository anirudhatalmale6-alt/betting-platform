import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/casino', label: 'Casino', icon: '🎰' },
  ];

  if (user) {
    navItems.push({ path: '/my-bets', label: 'My Bets', icon: '📋' });
    if (user.role === 'admin') {
      navItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' });
    }
    if (user.role === 'bookmaker') {
      navItems.push({ path: '/bookmaker', label: 'Bookmaker', icon: '📊' });
    }
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Top Marquee */}
      <div className="bg-primary-600 text-white text-sm py-1 overflow-hidden">
        <div className="marquee whitespace-nowrap">
          🏏 Welcome to BettingPro - Live Cricket, Football & Tennis Betting | Casino Games Available 24/7 | IPL 2026 Special Offers! 🎯
        </div>
      </div>

      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">BP</div>
              <span className="text-lg font-bold text-white hidden sm:block">Betting<span className="text-primary-500">Pro</span></span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span> {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-600 hover:border-dark-500 transition-colors"
                  >
                    <div className="text-right">
                      <div className="text-xs text-dark-400">{user.role.toUpperCase()}</div>
                      <div className="text-sm font-semibold text-primary-400">₹{user.balance?.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-1 z-50" onClick={() => setShowUserMenu(false)}>
                      <div className="px-4 py-2 border-b border-dark-600">
                        <div className="font-semibold text-sm">{user.full_name || user.username}</div>
                        <div className="text-xs text-dark-400">Balance: ₹{user.balance?.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-dark-400">Exposure: ₹{user.exposure?.toLocaleString('en-IN')}</div>
                      </div>
                      <Link to="/account" className="block px-4 py-2 text-sm hover:bg-dark-700">Account</Link>
                      <Link to="/my-bets" className="block px-4 py-2 text-sm hover:bg-dark-700">My Bets</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-dark-700">Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-sm">Login</Link>
              )}

              {/* Mobile menu toggle */}
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-dark-300 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenu && (
          <div className="md:hidden border-t border-dark-700 py-2 px-4" onClick={() => setMobileMenu(false)}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-lg text-sm ${location.pathname === item.path ? 'bg-primary-500/20 text-primary-400' : 'text-dark-300'}`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Sports Tabs */}
      <div className="bg-dark-900/50 border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto">
            <Link to="/" className="px-4 py-1.5 bg-dark-800 rounded-full text-sm font-medium text-dark-200 hover:bg-dark-700 whitespace-nowrap">🏏 Cricket</Link>
            <Link to="/?sport=2" className="px-4 py-1.5 bg-dark-800 rounded-full text-sm font-medium text-dark-200 hover:bg-dark-700 whitespace-nowrap">⚽ Football</Link>
            <Link to="/?sport=3" className="px-4 py-1.5 bg-dark-800 rounded-full text-sm font-medium text-dark-200 hover:bg-dark-700 whitespace-nowrap">🎾 Tennis</Link>
            <Link to="/casino" className="px-4 py-1.5 bg-dark-800 rounded-full text-sm font-medium text-dark-200 hover:bg-dark-700 whitespace-nowrap">🎰 Casino</Link>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-dark-700 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-dark-400 text-sm">
            BettingPro &copy; 2026. Play Responsibly. 18+ Only.
          </div>
        </div>
      </footer>
    </div>
  );
}
