// =============================================================================
// FILE: app/loading.tsx
// Loading UI shown during navigation and initial page loads
// =============================================================================

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 animate-spin rounded-full border-4 border-emerald/20 border-t-emerald" />
        <p className="text-sm font-medium text-white/60">Loading...</p>
      </div>
    </div>
  );
}
