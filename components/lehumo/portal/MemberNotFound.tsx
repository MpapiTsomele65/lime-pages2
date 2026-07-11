/**
 * Shown when the session is valid but the member record can't be loaded
 * (rare — e.g. the Airtable row was deleted). Rendered inside the portal
 * shell by any section page whose `getMemberById` returns null.
 */
export function MemberNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-8 text-center max-w-md">
        <h2 className="text-xl font-semibold text-white mb-2">
          Member Not Found
        </h2>
        <p className="text-white/60 text-sm">
          We could not load your profile. Please sign out and back in, or email
          lehumo@limepages.co.za if it persists.
        </p>
      </div>
    </div>
  );
}
