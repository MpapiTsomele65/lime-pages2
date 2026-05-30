import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

import { getSession } from "@/lib/session";
import { getMemberByIdLite } from "@/lib/airtable";
import { isAdminEmail } from "@/lib/admin-auth";
import { formatMemberNumber } from "@/lib/definitions";
import { PortalShell } from "@/components/lehumo/portal/PortalShell";
import { SecurityCard } from "@/components/lehumo/portal/SecurityCard";

/**
 * Member portal — Security page.
 *
 * One card today (password set / change / remove). Lives on its own
 * route rather than as a tab on the dashboard because:
 *   1. The Reabetswe-raised concern was security-shaped — making it a
 *      destination makes the message clear ("Lehumo takes security
 *      seriously enough that it has its own page").
 *   2. Future security primitives (2FA, session list, device
 *      management) slot in here without bloating the dashboard.
 *
 * `getMemberByIdLite` (no contribution hydration) is enough — we only
 * need `passwordHash` + `memberNumber` + `fullName`. Saves the
 * 60-period Contributions fetch on every page load.
 */
export default async function PortalSecurityPage() {
  const session = await getSession();
  if (!session) {
    redirect("/lehumo/portal/login");
  }

  const member = await getMemberByIdLite(session.memberId);
  const memberName = member?.fullName ?? session.fullName ?? "Member";
  const isAdmin = isAdminEmail(session.email);

  if (!member) {
    return (
      <PortalShell memberName={memberName} isAdmin={isAdmin}>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-[20px] border border-white/[0.06] bg-[#0F2040] p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Member Not Found
            </h2>
            <p className="text-white/50 text-sm">
              We could not load your profile. Please sign out and back
              in, or email lehumo@limepages.co.za if it persists.
            </p>
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell memberName={memberName} isAdmin={isAdmin}>
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <Link
          href="/lehumo/portal"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/55 hover:text-white/85 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div className="flex items-start gap-3 mb-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Security
            </h1>
            <p className="mt-1 text-sm text-white/55 leading-relaxed">
              Optional extras for protecting your{" "}
              <span className="text-white/85 font-medium">
                {formatMemberNumber(member.memberNumber)}
              </span>{" "}
              account. Your email + member-number sign-in always works
              — adding a password is an additional option you can use.
            </p>
          </div>
        </div>

        <SecurityCard
          hasPassword={Boolean(member.passwordHash)}
          memberNumber={formatMemberNumber(member.memberNumber)}
        />
      </div>
    </PortalShell>
  );
}
