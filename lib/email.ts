import "server-only";

import { Resend } from "resend";
import { formatMemberNumber } from "./definitions";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const FROM_ADDRESS = "Lehumo <lehumo@limepages.co.za>";

/* ─── Welcome email after onboarding ─── */
export async function sendWelcomeEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
}) {
  const { to, fullName, memberNumber } = params;
  const firstName = fullName.split(" ")[0];
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/lehumo/portal/login`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Welcome to Lehumo, ${firstName}! Your Member ID is ${formatMemberNumber(memberNumber)}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0B1933;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1933;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0F2040;border-radius:20px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
              <div style="font-size:13px;color:#46CDCF;margin-top:4px;">Collective Investment Trust</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">Welcome, ${firstName}!</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                You are now a Founding Member of Lehumo. Your journey to building generational wealth starts here.
              </p>

              <!-- Member Number Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(184,255,0,0.08);border:1px solid rgba(184,255,0,0.2);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">Your Member ID</div>
                    <div style="font-size:36px;font-weight:800;color:#B8FF00;line-height:1;">${formatMemberNumber(memberNumber)}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Save this — you'll need it to sign in to your portal.</div>
                  </td>
                </tr>
              </table>

              <!-- Login Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;">Your Login Details</div>
                    <table cellpadding="0" cellspacing="0" style="width:100%;">
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Email</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${to}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Member ID</td>
                        <td style="font-size:13px;font-weight:600;color:#B8FF00;padding:4px 0;text-align:right;">${formatMemberNumber(memberNumber)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Sign In to Your Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;">What Happens Next</div>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <span style="display:inline-block;width:24px;height:24px;background:rgba(70,205,207,0.15);border-radius:8px;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#46CDCF;margin-right:12px;">1</span>
                  </td>
                  <td style="padding:8px 0;">
                    <div style="font-size:14px;font-weight:600;color:#ffffff;">Submit Your KYC Documents</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px;">SA ID + Proof of Address via email or WhatsApp</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <span style="display:inline-block;width:24px;height:24px;background:rgba(70,205,207,0.15);border-radius:8px;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#46CDCF;margin-right:12px;">2</span>
                  </td>
                  <td style="padding:8px 0;">
                    <div style="font-size:14px;font-weight:600;color:#ffffff;">Make Your First Contribution</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px;">R1,000 via Paystack in your portal</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <span style="display:inline-block;width:24px;height:24px;background:rgba(70,205,207,0.15);border-radius:8px;text-align:center;line-height:24px;font-size:11px;font-weight:700;color:#46CDCF;margin-right:12px;">3</span>
                  </td>
                  <td style="padding:8px 0;">
                    <div style="font-size:14px;font-weight:600;color:#ffffff;">Join the Community</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px;">WhatsApp group + first virtual meeting</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:0;line-height:1.6;">
                Lehumo Collective Investment Trust &middot; Powered by Lime Pages<br/>
                <a href="https://www.limepages.co.za" style="color:#46CDCF;text-decoration:none;">limepages.co.za</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

/* ─── Forgot member number email ─── */
export async function sendMemberNumberEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
}) {
  const { to, fullName, memberNumber } = params;
  const firstName = fullName.split(" ")[0];
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/lehumo/portal/login`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your Lehumo Member ID — ${formatMemberNumber(memberNumber)}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0B1933;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1933;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0F2040;border-radius:20px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
              <div style="font-size:13px;color:#46CDCF;margin-top:4px;">Collective Investment Trust</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">Hi ${firstName},</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                You requested your Lehumo member number. Here it is:
              </p>

              <!-- Member Number Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(184,255,0,0.08);border:1px solid rgba(184,255,0,0.2);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">Your Member ID</div>
                    <div style="font-size:42px;font-weight:800;color:#B8FF00;line-height:1;">${formatMemberNumber(memberNumber)}</div>
                  </td>
                </tr>
              </table>

              <!-- Login Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <table cellpadding="0" cellspacing="0" style="width:100%;">
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Email</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${to}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Member ID</td>
                        <td style="font-size:13px;font-weight:600;color:#B8FF00;padding:4px 0;text-align:right;">${formatMemberNumber(memberNumber)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Sign In Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:0;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.<br/>
                <a href="https://www.limepages.co.za" style="color:#46CDCF;text-decoration:none;">limepages.co.za</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
