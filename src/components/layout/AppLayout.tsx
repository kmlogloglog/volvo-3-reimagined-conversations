import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useProfileStore } from '@/store/profileStore';
import { mapAgentStateToProfile } from '@/services/profileService';

/**
 * Root layout for all authenticated pages.
 *
 * Renders:
 *  - AnimatedBackground (fixed, behind everything)
 *  - Sidebar (left, w-64)
 *  - Header + scrollable content area (right, flex-1)
 *
 * Also manages:
 *  - Live Firestore sync (always-on while authenticated)
 *  - postMessage bridge from preview.html (freja:session-started)
 *  - Auto-navigation when a new profile is detected
 *
 * Nested inside ProtectedRoute so the auth guard fires first.
 */

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/overview')) return 'Overview';
  if (pathname.startsWith('/actions'))  return 'Actions';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/profiles')) return 'Profiles';
  return 'Van';
}

export default function AppLayout(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const addProfile = useProfileStore((s) => s.addProfile);
  const startLiveSync = useProfileStore((s) => s.startLiveSync);
  const stopLiveSync = useProfileStore((s) => s.stopLiveSync);
  const newProfileUserId = useProfileStore((s) => s.newProfileUserId);
  const clearNewProfileUserId = useProfileStore((s) => s.clearNewProfileUserId);

  // Keep live sync running for the entire authenticated session
  useEffect(() => {
    startLiveSync();
    return () => { stopLiveSync(); };
  }, [startLiveSync, stopLiveSync]);

  // Listen for postMessage from preview.html when a session starts
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'freja:session-started' && event.data.userId) {
        const userId = event.data.userId as string;
        const placeholder = mapAgentStateToProfile(userId, {});
        addProfile(placeholder);
        navigate(`/profiles/${userId}`);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => { window.removeEventListener('message', handleMessage); };
  }, [addProfile, navigate]);

  // Auto-navigate when a new profile is detected via live sync (backup path)
  useEffect(() => {
    if (newProfileUserId) {
      toast.success('New session detected — opening profile');
      navigate(`/profiles/${newProfileUserId}`);
      clearNewProfileUserId();
    }
  }, [newProfileUserId, navigate, clearNewProfileUserId]);

  return (
    <>
      <AnimatedBackground />

      <div className="flex h-full w-full overflow-hidden relative z-0">
        <Sidebar />

        <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
          <Header pageTitle={getPageTitle(location.pathname)} />

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="max-w-7xl mx-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
}
