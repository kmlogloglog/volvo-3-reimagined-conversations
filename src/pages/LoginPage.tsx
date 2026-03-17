import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

const FEATURES = [
  { icon: 'solar:cpu-bolt-linear', label: 'AI-Powered' },
  { icon: 'solar:graph-up-linear', label: 'Real-Time' },
  { icon: 'solar:user-speak-linear', label: 'Personalised' },
] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay, ease: 'easeOut' },
  }),
};

export default function LoginPage(): React.JSX.Element {
  const { authState, signIn } = useAuth();
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // ── Loading state ──
  if (authState === 'loading') {
    return (
      <div className="min-h-full flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Icon icon="solar:refresh-circle-linear" className="text-amber-500 animate-spin" width={28} />
          <p className="text-sm text-neutral-500">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Already authenticated → redirect to /profiles ──
  if (authState === 'authenticated') {
    return <Navigate to="/profiles" replace />;
  }

  // ── Sign-in handler ──
  async function handleSignIn(): Promise<void> {
    setError(null);
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        setIsSigningIn(false);
        return;
      }
      setError(firebaseError.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  }

  // ── Unauthenticated → render login form ──
  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <AnimatedBackground />

      <motion.div
        className="relative z-10 w-full max-w-sm"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(6, 6, 6, 0.78)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Amber top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <div className="px-8 pt-8 pb-6">
            {/* Brand mark */}
            <motion.div
              className="flex flex-col items-center mb-7"
              custom={0.08}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              {/* V logo mark */}
              <motion.div
                className="mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0.04) 100%)',
                  border: '1px solid rgba(251,191,36,0.22)',
                  boxShadow: '0 0 28px rgba(251,191,36,0.12), inset 0 1px 0 rgba(251,191,36,0.1)',
                }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
              >
                <span
                  className="text-2xl font-bold text-amber-400 select-none"
                  style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', lineHeight: 1 }}
                >
                  V
                </span>
              </motion.div>

              {/* Name + label */}
              <h1
                className="text-[26px] font-heading font-semibold tracking-tight leading-none"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                Vän
              </h1>
              <p className="text-[10px] uppercase tracking-[0.22em] text-amber-500/60 mt-1 font-medium">
                by Volvo
              </p>

              {/* Tagline */}
              <p className="text-sm mt-3 text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Profiling &amp; prediction for<br />personalised connections
              </p>

              {/* Feature pills */}
              <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                {FEATURES.map((f, i) => (
                  <motion.span
                    key={f.label}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.3 }}
                  >
                    <Icon icon={f.icon} width={11} />
                    {f.label}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Buttons section */}
            <motion.div
              custom={0.3}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Google sign-in */}
              <motion.button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.88)',
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSigningIn ? (
                  <Icon icon="solar:refresh-circle-linear" className="animate-spin" width={18} />
                ) : (
                  <Icon icon="logos:google-icon" width={18} />
                )}
                {isSigningIn ? 'Signing in…' : 'Continue with Google'}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  or
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Guest */}
              <motion.button
                type="button"
                onClick={signInAsGuest}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.28)',
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon icon="solar:user-linear" width={16} />
                Continue as Guest
              </motion.button>
            </motion.div>

            {/* Error */}
            {error !== null && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.18)',
                }}
              >
                <p className="text-xs text-rose-400 text-center">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="pb-5 text-center">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.13)' }}>
              Internal use only · Volvo Cars
            </p>
          </div>
        </div>

        {/* Ambient glow beneath card */}
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 -z-10 blur-2xl pointer-events-none"
          style={{ background: 'rgba(251,191,36,0.08)' }}
        />
      </motion.div>
    </div>
  );
}
