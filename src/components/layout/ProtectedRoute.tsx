import { Navigate, Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useAuth } from '@/hooks/useAuth';

/**
 * Layout route that guards all child routes behind authentication.
 *
 * Render states:
 *  - 'loading'           → spinner (prevents flash-of-login)
 *  - 'unauthenticated'   → redirect to /login
 *  - 'authenticated'     → render child routes via <Outlet />
 */
export default function ProtectedRoute(): React.JSX.Element {
  const { authState } = useAuth();

  if (authState === 'loading') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <AnimatedBackground fallbackOnly />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Icon
            icon="solar:refresh-circle-linear"
            className="text-neutral-500 animate-spin"
            width={28}
          />
          <p className="text-sm text-neutral-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
