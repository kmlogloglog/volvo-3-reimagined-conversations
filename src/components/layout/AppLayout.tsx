import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

/**
 * Root layout for all authenticated pages.
 *
 * Renders:
 *  - AnimatedBackground (fixed, behind everything)
 *  - Sidebar (left, w-64)
 *  - Header + scrollable content area (right, flex-1)
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
