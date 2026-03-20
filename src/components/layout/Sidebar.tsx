import { useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';

// ── Types ──

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly disabled?: boolean;
  readonly badge?: string;
}

interface NavSection {
  readonly label: string;
  readonly items: readonly NavItem[];
}

// ── Navigation data ──

const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Analytics',
    items: [
      {
        label: 'Profiles',
        path: '/profiles',
        icon: 'solar:users-group-rounded-linear',
      },
      {
        label: 'Overview',
        path: '/overview',
        icon: 'solar:widget-linear',
      },
      {
        label: 'Actions',
        path: '/actions',
        icon: 'solar:bolt-circle-linear',
      },
      {
        label: 'Map',
        path: '/map',
        icon: 'solar:map-point-linear',
      },
    ],
  },
];

// ── Component ──

interface SidebarProps {
  readonly className?: string;
}

export default function Sidebar({ className }: SidebarProps): React.JSX.Element {
  const location = useLocation();
  const { user, signOut } = useAuth();

  async function handleSignOut(): Promise<void> {
    try {
      await signOut();
    } catch {
      // Silent fail — the auth listener handles state transitions
    }
  }

  return (
    <aside
      className={cn(
        'van-sidebar-bg hidden md:flex w-64 flex-col border-r backdrop-blur-xl z-20',
        className,
      )}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b" style={{ borderColor: 'var(--van-border)' }}>
        <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
        </div>
        <span
          className="text-sm font-medium tracking-tight"
          style={{ color: 'var(--van-text-primary)' }}
        >
          Freja — Admin Dashboard
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            <div className="px-2 mb-2 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
              {section.label}
            </div>

            <div className="relative">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + '/');

                // Disabled item
                if (item.disabled) {
                  return (
                    <div
                      key={item.path}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-500 cursor-not-allowed opacity-50"
                    >
                      <Icon icon={item.icon} width={18} />
                      <span>{item.label}</span>
                      {item.badge !== undefined && (
                        <StatusBadge
                          label={item.badge}
                          variant="amber"
                          size="mini"
                          showDot={false}
                          className="ml-auto"
                        />
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all group',
                      isActive
                        ? 'shadow-sm'
                        : 'hover:bg-[var(--van-surface-hover)]',
                    )}
                    style={
                      isActive
                        ? { color: 'var(--van-text-primary)' }
                        : { color: 'var(--van-text-muted)' }
                    }
                  >
                    {/* Sliding active indicator pill */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'var(--van-surface)',
                          border: '1px solid var(--van-border)',
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}

                    <Icon
                      icon={item.icon}
                      width={18}
                      className={cn(
                        'relative z-10 transition-all',
                        isActive
                          ? 'text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.25)]'
                          : 'group-hover:text-[var(--van-text-primary)]',
                      )}
                    />
                    <span className={cn('relative z-10', isActive && 'font-medium')}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--van-border)' }}>
        {/* Settings (non-interactive) */}
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-default opacity-50"
          style={{ color: 'var(--van-text-muted)' }}
        >
          <Icon icon="solar:settings-linear" width={18} />
          <span>Settings</span>
        </div>

        {/* User card — click to sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          title="Click to sign out"
          className="mt-4 w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors text-left"
          style={{ background: 'var(--van-surface-hover)', borderColor: 'var(--van-border)' }}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Icon icon="solar:user-bold" width={16} className="text-white" />
          </div>

          {/* Name / email */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: 'var(--van-text-primary)' }}>
              {user?.displayName ?? 'Admin'}
            </div>
            <div className="text-[10px] text-neutral-500 truncate">
              {user?.email ?? ''}
            </div>
          </div>

          {/* Arrow icon */}
          <Icon
            icon="solar:alt-arrow-down-linear"
            width={14}
            className="text-neutral-500 shrink-0"
          />
        </button>
      </div>
    </aside>
  );
}
