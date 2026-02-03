import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { SongsPage } from './pages/SongsPage';
import { SongDetailPage } from './pages/SongDetailPage';
import { SongEditPage } from './pages/SongEditPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link to="/songs" className="text-xl font-bold text-slate-800">
            Songbook
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
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
