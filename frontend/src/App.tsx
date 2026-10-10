import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { authApi, UNAUTHORIZED_EVENT } from './api/client';
import { LoginPage } from './pages/LoginPage';
import { SongsPage } from './pages/SongsPage';
import { SongDetailPage } from './pages/SongDetailPage';
import { SongEditPage } from './pages/SongEditPage';

function Layout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/songs" className="text-xl font-bold text-slate-800">
            Songbook
          </Link>
          <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-800">
            Log out
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

type AuthState = 'checking' | 'anonymous' | 'authenticated';

export default function App() {
  const [auth, setAuth] = useState<AuthState>('checking');

  useEffect(() => {
    authApi.me().then(
      () => setAuth('authenticated'),
      () => setAuth('anonymous')
    );

    const handleUnauthorized = () => setAuth('anonymous');
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    setAuth('anonymous');
  };

  if (auth === 'checking') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (auth === 'anonymous') {
    return <LoginPage onLogin={() => setAuth('authenticated')} />;
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/songs" replace />} />
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/songs/new" element={<SongEditPage />} />
          <Route path="/songs/:id" element={<SongDetailPage />} />
          <Route path="/songs/:id/edit" element={<SongEditPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
