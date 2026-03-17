import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Icon } from '@iconify/react';
import SectionHeader from '@/components/ui/SectionHeader';
import GlassCard from '@/components/ui/GlassCard';
import ProfileCard from '@/components/features/ProfileCard';
import JsonUploadModal from '@/components/features/JsonUploadModal';
import { useProfileStore } from '@/store/profileStore';
// Auth store import removed — profiles always load from Firestore
import { useState } from 'react';

export default function ProfilesListPage(): React.JSX.Element {
  const profiles = useProfileStore((s) => s.profiles);
  const isLoading = useProfileStore((s) => s.isLoading);
  const error = useProfileStore((s) => s.error);
  const searchQuery = useProfileStore((s) => s.searchQuery);
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const setSearchQuery = useProfileStore((s) => s.setSearchQuery);
  const navigate = useNavigate();

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter((p) => {
      const name = p.profileData.demographics.name?.toLowerCase() ?? '';
      const city = p.profileData.demographics.city?.toLowerCase() ?? '';
      const email = p.profileData.demographics.email?.toLowerCase() ?? '';
      return name.includes(q) || city.includes(q) || email.includes(q);
    });
  }, [profiles, searchQuery]);

  return (
    <div>
      {/* Header */}
      <SectionHeader
        title="User Profiles"
        subtitle={`${profiles.length} profile${profiles.length !== 1 ? 's' : ''} loaded`}
        action={
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="van-ripple flex items-center gap-2 h-8 px-3 rounded-full bg-amber-500 text-sm text-black font-medium hover:bg-amber-400 transition-colors"
          >
            <Icon icon="solar:upload-minimalistic-linear" width={14} />
            Upload JSON
          </button>
        }
      />

      {/* Search */}
      <div className="relative group mt-6 mb-6">
        <Icon
          icon="solar:magnifer-linear"
          width={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
        />
        <input
          type="text"
          placeholder="Search by name, city, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-full h-9 pl-9 pr-4 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
          >
            <Icon icon="solar:close-circle-linear" width={14} />
          </button>
        )}
      </div>

      {/* Loading — shimmer skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={`skeleton-${String(i)}`}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full van-skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 van-skeleton rounded" />
                    <div className="h-2 w-16 van-skeleton rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-28 van-skeleton rounded-full" />
                  <div className="h-5 w-20 van-skeleton rounded-full" />
                </div>
                <div className="h-1.5 w-full van-skeleton rounded-full" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Error */}
      {error !== null && !isLoading && (
        <GlassCard className="text-center py-8">
          <Icon icon="solar:danger-triangle-linear" width={32} className="mx-auto text-rose-400 mb-3" />
          <p className="text-sm text-rose-400 font-medium mb-1">Failed to load profiles</p>
          <p className="text-xs text-neutral-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => void loadProfiles()}
            className="van-ripple h-8 px-4 rounded-lg border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </GlassCard>
      )}

      {/* Empty */}
      {!isLoading && error === null && filteredProfiles.length === 0 && (
        <GlassCard className="text-center py-12">
          <Icon icon="solar:users-group-rounded-linear" width={40} className="mx-auto text-neutral-600 mb-4" />
          {searchQuery ? (
            <>
              <p className="text-sm text-white font-medium mb-1">No matching profiles</p>
              <p className="text-xs text-neutral-500">No profiles match "{searchQuery}". Try a different search.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-white font-medium mb-1">No profiles yet</p>
              <p className="text-xs text-neutral-500 mb-4">Upload a Van Profile JSON to get started.</p>
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="van-ripple inline-flex items-center gap-2 h-8 px-4 rounded-full bg-amber-500 text-sm text-black font-medium hover:bg-amber-400 transition-colors"
              >
                <Icon icon="solar:upload-minimalistic-linear" width={14} />
                Upload JSON
              </button>
            </>
          )}
        </GlassCard>
      )}

      {/* Profile grid — staggered reveal */}
      {!isLoading && error === null && filteredProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProfiles.map((profile, index) => (
            <motion.div
              key={profile.userId}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, delay: index * 0.07, ease: 'easeOut' }}
            >
              <ProfileCard
                profile={profile}
                onQuickView={() => void navigate(`/profiles/${profile.userId}`)}
                onAdvancedView={() => void navigate(`/profiles/${profile.userId}?view=advanced`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <JsonUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}
