import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

import { getSession } from "@/lib/session";
import { getMemberByIdLite } from "@/lib/airtable";
import { formatMemberNumber } from "@/lib/definitions";
import { SecurityCard } from "@/components/lehumo/portal/SecurityCard";
import { MemberNotFound } from "@/components/lehumo/portal/MemberNotFound";

/**
 * Member portal — Security page. URL `/lehumo/portal/security`.
 *
 * Reached from the header "Security" pill (not the section sidebar).
 * `getMemberByIdLite` is enough — we only need passwordHash + number +
 * name, so we skip the 60-period Contributions hydration.
 */
export default async function PortalSecurityPage() {
  const session = await getSession();
  if (!session) return null; // layout redirects

  const member = await getMemberByIdLite(session.memberId);
  if (!member) return <MemberNotFound />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/lehumo/portal"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 hover:text-white transition-colors mb-6"
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
          <p className="mt-1 text-sm text-white/60 leading-relaxed">
            Optional extras for protecting your{" "}
            <span className="text-white/85 font-medium">
              {formatMemberNumber(member.memberNumber)}
            </span>{" "}
            account. Your email + member-number sign-in always works — adding a
            password is an additional option you can use.
          </p>
        </div>
      </div>

      <SecurityCard
        hasPassword={Boolean(member.passwordHash)}
        memberNumber={formatMemberNumber(member.memberNumber)}
      />
    </div>
  );
}
