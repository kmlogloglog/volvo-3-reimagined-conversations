import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useThemeStore } from '@/store/themeStore';
import { signInAnon } from '@/services/authService';
import LoginPage from '@/pages/LoginPage';
import DesignSystemTest from '@/pages/DesignSystemTest';
import ProfilesListPage from '@/pages/ProfilesListPage';
import ProfileDetailPage from '@/pages/ProfileDetailPage';
import OverviewPage from '@/pages/OverviewPage';
import ActionsPage from '@/pages/ActionsPage';
import MapPage from '@/pages/MapPage';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

function App(): React.JSX.Element {
  const theme = useThemeStore((s) => s.theme);

  // Auto sign-in anonymously so Firestore rules (request.auth != null) pass
  useEffect(() => { void signInAnon(); }, []);

  // Keep <html> class in sync with store (handles first mount + future toggles)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <BrowserRouter basename="/dashboard">
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        toastOptions={{
          style: {
            background: 'var(--van-surface)',
            borderColor: 'var(--van-border)',
            color: 'var(--van-text-primary)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/design-system" element={<DesignSystemTest />} />

        {/* Protected routes — auth guard wraps app shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/profiles" replace />} />
            <Route path="/profiles" element={<ProfilesListPage />} />
            <Route path="/profiles/:userId" element={<ProfileDetailPage />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/actions" element={<ActionsPage />} />
            <Route path="/map" element={<MapPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
