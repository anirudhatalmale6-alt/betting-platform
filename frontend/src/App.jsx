import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import EventPage from './pages/EventPage';
import CasinoPage from './pages/CasinoPage';
import MyBetsPage from './pages/MyBetsPage';
import AccountPage from './pages/AccountPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEvents from './pages/admin/AdminEvents';
import AdminBets from './pages/admin/AdminBets';
import AdminSettings from './pages/admin/AdminSettings';
import BookmakerPanel from './pages/bookmaker/BookmakerPanel';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } }} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="event/:id" element={<EventPage />} />
          <Route path="casino" element={<CasinoPage />} />
          <Route path="my-bets" element={<ProtectedRoute><MyBetsPage /></ProtectedRoute>} />
          <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="admin/events" element={<ProtectedRoute roles={['admin']}><AdminEvents /></ProtectedRoute>} />
          <Route path="admin/bets" element={<ProtectedRoute roles={['admin']}><AdminBets /></ProtectedRoute>} />
          <Route path="admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />
          <Route path="bookmaker" element={<ProtectedRoute roles={['bookmaker']}><BookmakerPanel /></ProtectedRoute>} />
        </Route>
      </Routes>
    </>
  );
}
