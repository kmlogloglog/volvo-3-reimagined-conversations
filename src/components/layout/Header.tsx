import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';

interface HeaderProps {
  readonly pageTitle?: string;
  readonly className?: string;
}

export default function Header({
  pageTitle = 'Profiles',
  className,
}: HeaderProps): React.JSX.Element {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <header
      className={cn(
        'van-header-bg h-16 border-b flex items-center justify-between px-8 z-20 shrink-0',
        className,
      )}
      style={{ borderColor: 'var(--van-border)' }}
    >
      {/* Left — Two-line breadcrumb */}
      <div className="flex flex-col">
        <div
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium"
          style={{ color: 'rgba(0,0,0,0.35)' }}
        >
          <span style={{ color: 'var(--van-text-muted)' }}>Van</span>
          <Icon icon="solar:alt-arrow-right-linear" width={10} />
          <span className="text-amber-500">{pageTitle}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.h1
            key={pageTitle}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-lg font-heading font-medium tracking-tight"
            style={{ color: 'var(--van-text-primary)' }}
          >
            {pageTitle}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-3">
        {/* Search input — read-only for MVP */}
        <div className="relative group">
          <Icon
            icon="solar:magnifer-linear"
            width={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors"
          />
          <input
            type="text"
            placeholder="Search..."
            readOnly
            className="border rounded-full h-8 pl-9 pr-10 text-xs focus:outline-none transition-all w-48 cursor-default"
            style={{
              background: 'var(--van-surface-hover)',
              borderColor: 'var(--van-border)',
              color: 'var(--van-text-primary)',
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <span
              className="text-[10px] border rounded px-1.5"
              style={{ color: 'var(--van-text-muted)', borderColor: 'var(--van-border)' }}
            >
              ⌘K
            </span>
          </div>
        </div>

        {/* Theme toggle */}
        <motion.button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors"
          style={{
            background: 'var(--van-surface-hover)',
            borderColor: 'var(--van-border)',
            color: 'var(--van-text-secondary)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, rotate: 180 }}
        >
          <Icon
            icon={isDark ? 'solar:sun-bold' : 'solar:moon-bold'}
            width={15}
          />
        </motion.button>

        {/* Notification bell */}
        <motion.button
          type="button"
          className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors relative"
          style={{
            background: 'var(--van-surface-hover)',
            borderColor: 'var(--van-border)',
            color: 'var(--van-text-secondary)',
          }}
          whileHover={{ rotate: [0, 15, -15, 8, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon icon="solar:bell-linear" width={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
        </motion.button>
      </div>
    </header>
  );
}
