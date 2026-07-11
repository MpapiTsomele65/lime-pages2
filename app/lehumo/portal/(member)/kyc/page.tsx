import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/airtable";
import { KycSection } from "@/components/lehumo/portal/sections/KycSection";
import { MemberNotFound } from "@/components/lehumo/portal/MemberNotFound";

/** KYC / FICA Documents — verification status + document uploads.
 *  URL `/lehumo/portal/kyc`. */
export default async function KycPage() {
  const session = await getSession();
  if (!session) return null;

  const member = await getMemberById(session.memberId);
  if (!member) return <MemberNotFound />;

  return <KycSection member={member} />;
}
