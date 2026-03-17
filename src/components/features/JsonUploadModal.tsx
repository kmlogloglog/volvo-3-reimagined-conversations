import { useState, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import GlassPanel from '@/components/ui/GlassPanel';
import StatusBadge from '@/components/ui/StatusBadge';
import { validateVanProfile } from '@/utils/schemaValidator';
import { uploadProfile } from '@/services/profileService';
import { useProfileStore } from '@/store/profileStore';
// Auth store import removed — all uploads go to Firestore regardless of auth state
import { cn } from '@/lib/utils';
import type { VanProfile, VanProfileWithId } from '@/types/profile';

interface JsonUploadModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

type UploadStep = 'select' | 'validate' | 'confirm' | 'uploading' | 'success' | 'error';
type InputMode = 'file' | 'paste';

export default function JsonUploadModal({
  isOpen,
  onClose,
}: JsonUploadModalProps): React.JSX.Element | null {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>('select');
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [fileName, setFileName] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<readonly string[]>([]);
  const [validatedProfile, setValidatedProfile] = useState<VanProfile | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const addProfile = useProfileStore((s) => s.addProfile);

  // ── Reset state ──
  function reset(): void {
    setStep('select');
    setFileName('');
    setPasteText('');
    setValidationErrors([]);
    setValidatedProfile(null);
    setUserId('');
    setUploadError('');
    setIsDragOver(false);
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  // ── Shared JSON parse + validate logic ──
  function processJsonText(text: string, sourceName: string): void {
    setFileName(sourceName);
    setStep('validate');
    try {
      const parsed: unknown = JSON.parse(text);
      const result = validateVanProfile(parsed);

      if (!result.valid || result.profile === null) {
        setValidationErrors(result.errors);
        return;
      }

      setValidatedProfile(result.profile);

      const name = result.profile.profileData.demographics.name;
      const email = result.profile.profileData.demographics.email;
      const derivedId =
        name?.toLowerCase().replace(/\s+/g, '-') ??
        email?.split('@')[0] ??
        `profile-${Date.now()}`;
      setUserId(derivedId);
      setStep('confirm');
    } catch {
      setValidationErrors(['Invalid JSON: could not be parsed']);
    }
  }

  // ── Process file ──
  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        setFileName(file.name);
        setStep('validate');
        setValidationErrors(['Failed to read file content']);
        return;
      }
      processJsonText(text, file.name);
    };
    reader.onerror = () => {
      setFileName(file.name);
      setStep('validate');
      setValidationErrors(['Failed to read the file']);
    };
    reader.readAsText(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── File input handler ──
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  // ── Drag & drop ──
  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(): void {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  // ── Paste submit ──
  function handlePasteSubmit(): void {
    const trimmed = pasteText.trim();
    if (!trimmed) return;
    processJsonText(trimmed, 'pasted-json');
  }

  // ── Upload ──
  async function handleUpload(): Promise<void> {
    if (!validatedProfile || !userId) return;

    setStep('uploading');

    const profileWithId: VanProfileWithId = {
      userId,
      ...validatedProfile,
    };

    try {
      await uploadProfile(userId, validatedProfile);
      addProfile(profileWithId);
      setStep('success');
      toast.success('Profile saved to Firestore');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
      setStep('error');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <GlassPanel padding="spacious">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-medium text-white">
              Load Profile
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon icon="solar:close-circle-linear" width={16} />
            </button>
          </div>

          {/* ── Step: Select ── */}
          {step === 'select' && (
            <div>
              {/* Mode tabs */}
              <div className="flex items-center gap-1 border-b border-white/5 mb-5">
                {(['file', 'paste'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setInputMode(mode)}
                    className={cn(
                      'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
                      inputMode === mode
                        ? 'text-white border-amber-500'
                        : 'text-neutral-500 border-transparent hover:text-neutral-300',
                    )}
                  >
                    {mode === 'file' ? 'Upload File' : 'Paste JSON'}
                  </button>
                ))}
              </div>

              {/* File drop zone */}
              {inputMode === 'file' && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                    isDragOver
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-white/10 hover:border-white/20',
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                >
                  <Icon
                    icon="solar:upload-minimalistic-linear"
                    width={32}
                    className="mx-auto text-neutral-500 mb-3"
                  />
                  <p className="text-sm text-neutral-400 mb-1">
                    Drop a JSON file here or click to browse
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    Must match the Vän Profile Schema
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Paste zone */}
              {inputMode === 'paste' && (
                <div>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder='Paste your Vän Profile JSON here…'
                    rows={10}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-3 text-xs font-mono text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-white/20 resize-none"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={handlePasteSubmit}
                    disabled={pasteText.trim().length === 0}
                    className="mt-3 w-full h-9 rounded-lg bg-amber-500 text-sm text-black font-medium hover:bg-amber-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Parse &amp; Validate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step: Validating / errors ── */}
          {step === 'validate' && validationErrors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="solar:danger-triangle-linear" width={18} className="text-rose-400" />
                <span className="text-sm text-rose-400 font-medium">Validation Failed</span>
              </div>
              <div className="text-xs text-neutral-400 mb-3">
                <span className="text-white font-medium">{fileName}</span> has the following issues:
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {validationErrors.map((error) => (
                  <div
                    key={error}
                    className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/5 border border-rose-500/20 rounded-lg p-2"
                  >
                    <Icon icon="solar:close-circle-linear" width={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={reset}
                className="w-full h-9 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Step: Confirm upload ── */}
          {step === 'confirm' && validatedProfile !== null && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="solar:check-circle-linear" width={18} className="text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">Validation Passed</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Source</span>
                  <span className="text-white">{fileName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Name</span>
                  <span className="text-white">
                    {validatedProfile.profileData.demographics.name ?? 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">User ID</span>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-white/[0.03] border border-white/10 rounded-lg h-7 px-2 text-xs text-white text-right w-48 focus:outline-none focus:border-white/20"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Stage</span>
                  <StatusBadge
                    label={validatedProfile.analyticalScores.propensityToBuy.stage}
                    variant={
                      validatedProfile.analyticalScores.propensityToBuy.stage === 'decision'
                        ? 'green'
                        : validatedProfile.analyticalScores.propensityToBuy.stage === 'consideration'
                          ? 'blue'
                          : 'purple'
                    }
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Completeness</span>
                  <span className="text-white">{validatedProfile.meta.profileCompleteness}%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 text-sm text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  className="flex-1 h-9 rounded-lg bg-amber-500 text-sm text-black font-medium hover:bg-amber-400 transition-colors"
                >
                  Load Profile
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Uploading ── */}
          {step === 'uploading' && (
            <div className="flex flex-col items-center py-6">
              <Icon
                icon="solar:refresh-circle-linear"
                width={28}
                className="text-amber-400 animate-spin mb-3"
              />
              <p className="text-sm text-neutral-400">
                Uploading to Firestore…
              </p>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-6">
              <Icon icon="solar:check-circle-linear" width={32} className="text-emerald-400 mb-3" />
              <p className="text-sm text-white font-medium mb-1">Profile loaded!</p>
              <p className="text-xs text-neutral-500 mb-4">
                Saved as{' '}
                <span className="text-white font-medium">{userId}</span>
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-6 rounded-lg bg-amber-500 text-sm text-black font-medium hover:bg-amber-400 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* ── Step: Error ── */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-6">
              <Icon icon="solar:danger-triangle-linear" width={32} className="text-rose-400 mb-3" />
              <p className="text-sm text-rose-400 font-medium mb-1">Upload failed</p>
              <p className="text-xs text-neutral-500 mb-4">{uploadError}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="h-9 px-6 rounded-lg border border-white/10 bg-white/5 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 px-6 rounded-lg border border-white/10 bg-white/5 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
