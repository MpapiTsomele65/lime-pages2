import "server-only";

import { Resend } from "resend";
import { formatMemberNumber } from "./definitions";
import { siteUrl } from "./site-url";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const FROM_ADDRESS = "Lehumo <lehumo@limepages.co.za>";

/**
 * Admin mailbox that gets a BCC on every member-facing transactional
 * send. Two purposes:
 *   1. Audit trail — the lehumo@limepages.co.za inbox becomes a
 *      timestamped log of who got which email when (search by member
 *      name / number / date), so support can answer "did Londani get
 *      her welcome?" without diving into Resend logs.
 *   2. Render check — admins see exactly what the member sees and can
 *      catch broken templates fast (especially during the soft launch
 *      while copy + CTAs are still settling).
 */
const ADMIN_BCC = "lehumo@limepages.co.za";

/* ─── Welcome email after onboarding ─── */
export async function sendWelcomeEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
}) {
  const { to, fullName, memberNumber } = params;
  const firstName = fullName.split(" ")[0];
  // Portal login URL — landing page after sign-in is the dashboard,
  // which renders the KycDocumentsCard for any member with KYC pending.
  // So this single link covers "continue onboarding" + "upload docs"
  // without needing a separate deep link.
  const portalUrl = `${siteUrl()}/lehumo/portal/login`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
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
                  <td align="center" style="padding:8px 0 8px;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Continue Your Onboarding &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 24px;">
                    <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0;line-height:1.5;">
                      Sign in to upload your KYC documents and complete your registration.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Next Steps - vertical timeline visual mirroring the
                   portal's KYC tracker (teal-outlined badges joined by a
                   thin connector line). Single-row layout: left column
                   stacks circle-line-circle, right column stacks the two
                   text blocks. The connector height (62px) is calibrated
                   to align circle-2 with the start of step-2's text. -->
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:16px;">What Happens Next</div>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <!-- Timeline rail -->
                  <td width="40" valign="top" style="padding:0;">
                    <!-- Step 1 badge -->
                    <div style="width:32px;height:32px;border-radius:50%;background:rgba(70,205,207,0.12);border:2px solid #46CDCF;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#46CDCF;">1</div>
                    <!-- Connector -->
                    <div style="width:2px;height:62px;background:rgba(70,205,207,0.3);margin:8px 0 8px 15px;"></div>
                    <!-- Step 2 badge -->
                    <div style="width:32px;height:32px;border-radius:50%;background:rgba(70,205,207,0.12);border:2px solid #46CDCF;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#46CDCF;">2</div>
                  </td>
                  <!-- Step copy column -->
                  <td valign="top" style="padding:0 0 0 14px;">
                    <!-- Step 1 -->
                    <div style="margin-bottom:32px;padding-top:5px;">
                      <div style="font-size:14px;font-weight:600;color:#ffffff;line-height:1.3;">Make Your First Contribution</div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;line-height:1.6;">Your first contribution confirms your spot. Thank you for choosing the frictionless option for automated collections.</div>
                    </div>
                    <!-- Step 2 -->
                    <div style="padding-top:5px;">
                      <div style="font-size:14px;font-weight:600;color:#ffffff;line-height:1.3;">Upload Your KYC Documents</div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;line-height:1.6;">SA ID + Proof of Address \u2014 <a href="${portalUrl}" style="color:#46CDCF;text-decoration:underline;">upload them in your portal</a></div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Support note -->
              <p style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7;margin:0;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
                For any enquiries or admin issues, please email <a href="mailto:lehumo@limepages.co.za" style="color:#46CDCF;text-decoration:none;font-weight:600;">lehumo@limepages.co.za</a>.
              </p>
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

/* ─── Payment success / activation email ─── */
export async function sendPaymentSuccessEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
  amountZar: number;
  month: string;
}) {
  const { to, fullName, memberNumber, amountZar, month } = params;
  const firstName = fullName.split(" ")[0];
  const portalUrl = `${siteUrl()}/lehumo/portal/login`;
  const formattedAmount = `R${amountZar.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: `Payment received \u2014 your Lehumo membership is now Active (${formatMemberNumber(memberNumber)})`,
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

          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
              <div style="font-size:13px;color:#46CDCF;margin-top:4px;">Collective Investment Trust</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">You're in, ${firstName}.</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                We've received your first contribution and your Lehumo membership is now <strong style="color:#B8FF00;">Active</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(184,255,0,0.08);border:1px solid rgba(184,255,0,0.2);border-radius:14px;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">Your Member ID</div>
                    <div style="font-size:36px;font-weight:800;color:#B8FF00;line-height:1;">${formatMemberNumber(memberNumber)}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Save this \u2014 you'll need it to sign in to your portal.</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;">Payment Receipt</div>
                    <table cellpadding="0" cellspacing="0" style="width:100%;">
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Amount</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Month</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${month}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Email</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${to}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Sign In to Your Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;margin:0;">
                If you haven't yet, please send your KYC documents (SA ID + proof of address) to <a href="mailto:lehumo@limepages.co.za" style="color:#46CDCF;text-decoration:none;">lehumo@limepages.co.za</a> or via WhatsApp so we can complete your file.
              </p>
            </td>
          </tr>

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
  const portalUrl = `${siteUrl()}/lehumo/portal/login`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
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

/* ─── KYC documents received (auto, on upload) ─── */
export async function sendKycReceivedEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
}) {
  const { to, fullName, memberNumber } = params;
  const firstName = fullName.split(" ")[0];
  const portalUrl = `${siteUrl()}/lehumo/portal/login`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: `We've received your KYC documents \u2014 reviewing now (${formatMemberNumber(memberNumber)})`,
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
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">Got it, ${firstName}.</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                We've received your KYC documents and we're reviewing them now. You'll get another email as soon as your file is verified \u2014 usually within 1\u20132 business days.
              </p>

              <!-- Status Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(70,205,207,0.08);border:1px solid rgba(70,205,207,0.2);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">Current Status</div>
                    <div style="font-size:20px;font-weight:700;color:#46CDCF;line-height:1.2;">In Review</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Member ID: <span style="color:#B8FF00;font-weight:600;">${formatMemberNumber(memberNumber)}</span></div>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;margin:0 0 24px;">
                If we need anything else from you, we'll reach out directly. No action required from your side right now.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      View Your Portal &rarr;
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

/* ─── KYC verified (admin-triggered, on transition to Complete) ─── */
export async function sendKycVerifiedEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
}) {
  const { to, fullName, memberNumber } = params;
  const firstName = fullName.split(" ")[0];
  const portalUrl = `${siteUrl()}/lehumo/portal/login`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: `Your KYC is verified \u2014 welcome aboard, ${firstName}`,
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
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">You're verified, ${firstName}.</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                Your KYC documents have been reviewed and approved. Your Lehumo file is now <strong style="color:#B8FF00;">Complete</strong> \u2014 you have full access to the portal and all member benefits.
              </p>

              <!-- Status Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(184,255,0,0.08);border:1px solid rgba(184,255,0,0.2);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">KYC Status</div>
                    <div style="font-size:24px;font-weight:800;color:#B8FF00;line-height:1.2;">Verified &check;</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Member ID: <span style="color:#B8FF00;font-weight:600;">${formatMemberNumber(memberNumber)}</span></div>
                  </td>
                </tr>
              </table>

              <!-- What's Next -->
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;">What's Unlocked</div>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="display:inline-block;width:8px;height:8px;background:#B8FF00;border-radius:50%;margin:7px 12px 0 0;"></span>
                  </td>
                  <td style="padding:6px 0;font-size:14px;color:#ffffff;line-height:1.5;">
                    Monthly contribution tracking in your portal
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="display:inline-block;width:8px;height:8px;background:#B8FF00;border-radius:50%;margin:7px 12px 0 0;"></span>
                  </td>
                  <td style="padding:6px 0;font-size:14px;color:#ffffff;line-height:1.5;">
                    Emergency access (after 6 months of contributions)
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="display:inline-block;width:8px;height:8px;background:#B8FF00;border-radius:50%;margin:7px 12px 0 0;"></span>
                  </td>
                  <td style="padding:6px 0;font-size:14px;color:#ffffff;line-height:1.5;">
                    Annual dividends, funeral cover, and Lime Pages profile
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Open Your Portal &rarr;
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

/* ─── Recurring contribution receipt ───
 *
 * Sent on EVERY successful contribution after the first (first
 * contribution gets the welcome-flavoured `sendPaymentSuccessEmail`
 * with the "now Active" framing). This is the ongoing monthly
 * receipt — same payment-receipt details, less ceremony.
 *
 * Webhook + verify routes pick which email to fire by reading the
 * member's pre-payment status: !wasAlreadyActive → activation email,
 * otherwise → this monthly receipt.
 */
export async function sendContributionReceiptEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
  amountZar: number;
  /** Display copy for the period — e.g. "June" or "June 2026". */
  monthLabel: string;
  /** Paystack reference / EFT ref. Surfaces on the receipt for
   *  reconciliation against bank statements. */
  paymentReference?: string;
}) {
  const {
    to,
    fullName,
    memberNumber,
    amountZar,
    monthLabel,
    paymentReference,
  } = params;
  const firstName = fullName.split(" ")[0];
  const portalUrl = `${siteUrl()}/lehumo/portal/login`;
  const formattedAmount = `R${amountZar.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: `${monthLabel} contribution received — ${formattedAmount} (${formatMemberNumber(memberNumber)})`,
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

          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
              <div style="font-size:13px;color:#46CDCF;margin-top:4px;">Collective Investment Trust</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">Thanks, ${firstName}.</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                We've received your <strong style="color:#ffffff;">${monthLabel}</strong> contribution of <strong style="color:#B8FF00;">${formattedAmount}</strong>. Your equity in the trust just ticked up.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;">Receipt</div>
                    <table cellpadding="0" cellspacing="0" style="width:100%;">
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Amount</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Period</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${monthLabel}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Member</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${formatMemberNumber(memberNumber)}</td>
                      </tr>
                      ${
                        paymentReference
                          ? `
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Reference</td>
                        <td style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.85);padding:4px 0;text-align:right;font-family:monospace;">${paymentReference}</td>
                      </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      View In Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;margin:0;">
                Your portal shows your full contribution history, lifetime total, and emergency-access eligibility as it grows.
              </p>
            </td>
          </tr>

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

/* ─── Monthly contribution reminder (15th SAST) ───
 *
 * First reminder of the month. Fires only for active members who
 * haven't paid for the current period by the 15th. Tone is gentle —
 * the bulk of paid members never see this, and the ones who do are
 * usually still planning to pay (mid-month is the start of the
 * payment window for most South African salary cycles).
 *
 * Pair with `sendContributionFinalReminderEmail` (25th) — those two
 * emails are the entire automated chase cadence. Anything beyond
 * that is admin discretion.
 */
export async function sendContributionReminderEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
  /** Display copy for the period — e.g. "June" or "June 2026". */
  monthLabel: string;
  /** Total contribution amount for this member's plan tier. ZAR with
   *  cents (e.g. 1019.90 for Standard, 1000 for Basic). */
  amountZar: number;
}) {
  const { to, fullName, memberNumber, monthLabel, amountZar } = params;
  const firstName = fullName.split(" ")[0];
  const portalUrl = `${siteUrl()}/lehumo/portal/login`;
  const formattedAmount = `R${amountZar.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: `Reminder — your ${monthLabel} contribution of ${formattedAmount} (${formatMemberNumber(memberNumber)})`,
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

          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
              <div style="font-size:13px;color:#46CDCF;margin-top:4px;">Collective Investment Trust</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">Hi ${firstName},</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                Just a reminder that your <strong style="color:#ffffff;">${monthLabel}</strong> contribution of <strong style="color:#B8FF00;">${formattedAmount}</strong> hasn't reflected yet. If your debit order has already gone off, this is just a heads-up — sometimes payments take a day or two to land.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(70,205,207,0.08);border:1px solid rgba(70,205,207,0.2);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">This Month</div>
                    <div style="font-size:24px;font-weight:800;color:#46CDCF;line-height:1;">${formattedAmount}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">${monthLabel} · Member ${formatMemberNumber(memberNumber)}</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Open Member Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;margin:0;">
                Already paid via EFT? Reconciliation can take a day or two. If you don't see it credited by the 25th, drop us a line at <a href="mailto:lehumo@limepages.co.za" style="color:#46CDCF;text-decoration:none;">lehumo@limepages.co.za</a> and we'll trace it.
              </p>
            </td>
          </tr>

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

/* ─── Final contribution reminder (25th SAST) ───
 *
 * Last automated chase. After this, admin handles personally — no
 * member gets a third automated email about the same period. Tone is
 * firmer than the 15th reminder but still respectful.
 */
export async function sendContributionFinalReminderEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
  monthLabel: string;
  amountZar: number;
}) {
  const { to, fullName, memberNumber, monthLabel, amountZar } = params;
  const firstName = fullName.split(" ")[0];
  const portalUrl = `${siteUrl()}/lehumo/portal/login`;
  const formattedAmount = `R${amountZar.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: `Final reminder — your ${monthLabel} contribution (${formatMemberNumber(memberNumber)})`,
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

          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
              <div style="font-size:13px;color:#46CDCF;margin-top:4px;">Collective Investment Trust</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">Hi ${firstName},</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                Your <strong style="color:#ffffff;">${monthLabel}</strong> contribution of <strong style="color:#B8FF00;">${formattedAmount}</strong> is still outstanding. We&apos;d hate for you to fall behind on the founding cohort — please settle this month before the end of the month so your equity tracks against the rest of the group.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(254,243,199,0.08);border:1px solid rgba(254,243,199,0.2);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <div style="font-size:11px;font-weight:700;color:rgba(254,243,199,0.85);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">Last Reminder</div>
                    <div style="font-size:24px;font-weight:800;color:#fde68a;line-height:1;">${formattedAmount}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">${monthLabel} · Member ${formatMemberNumber(memberNumber)}</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Pay From Your Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;margin:0 0 12px;">
                If something has come up that&apos;s making this month difficult, please reply to this email or message <a href="mailto:lehumo@limepages.co.za" style="color:#46CDCF;text-decoration:none;">lehumo@limepages.co.za</a> directly. We&apos;d rather work it out together than have you fall behind silently.
              </p>
              <p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;margin:0;">
                This is the last automated reminder you&apos;ll get for ${monthLabel} — anything beyond this comes from Mpapi or the team personally.
              </p>
            </td>
          </tr>

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

// ──────────────────────────────────────────────────────────────────────
// Steering Committee volunteer flow
// ──────────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
}

/**
 * Member-side acknowledgement — fires after a Steering Committee
 * volunteer submission lands. Confirms what we captured + what
 * happens next (decision at the Kick-off QGM 11 Jun 2026).
 */
export async function sendSteeringMemberAck(params: {
  to: string;
  fullName: string;
  memberNumber: number;
  expertise: string;
  motivation: string;
  isUpdate: boolean;
}) {
  const { to, fullName, memberNumber, expertise, motivation, isUpdate } = params;
  const firstName = (fullName || "there").split(" ")[0];
  const memberRef = formatMemberNumber(memberNumber);
  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: isUpdate
      ? `Steering Committee — submission updated (${memberRef})`
      : `Steering Committee — application received (${memberRef})`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0B1933;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1933;padding:40px 20px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0F2040;border-radius:20px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
<div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
<div style="font-size:13px;color:#46CDCF;margin-top:4px;">Executive Steering Governance Committee</div></td></tr>
<tr><td style="padding:32px;">
<h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">Thanks for stepping up, ${escapeHtml(firstName)}.</h1>
<p style="font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;margin:0 0 20px;">${isUpdate ? "We&rsquo;ve updated your" : "We&rsquo;ve recorded your"} application for the Lehumo Executive Steering Governance Committee. A six-person committee will be confirmed at our <strong style="color:#fff;">Kick-off QGM on Thursday, 11 June 2026</strong>. If more than six people volunteer, we&rsquo;ll run a quick election before then.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(184,255,0,0.06);border:1px solid rgba(184,255,0,0.20);border-radius:14px;margin-bottom:18px;"><tr><td style="padding:18px 22px;">
<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">Member</div>
<div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:14px;">${escapeHtml(fullName)} &middot; ${memberRef}</div>
<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">Expertise you bring</div>
<div style="font-size:14px;color:rgba(255,255,255,0.85);line-height:1.65;${motivation ? "margin-bottom:14px;" : ""}">${escapeHtml(expertise)}</div>
${motivation ? `<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;">Why you want to serve</div><div style="font-size:14px;color:rgba(255,255,255,0.85);line-height:1.65;">${escapeHtml(motivation)}</div>` : ""}
</td></tr></table>
<p style="font-size:13.5px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 16px;">You can <strong style="color:#fff;">update or withdraw</strong> your submission any time from the portal &mdash; the Steering Committee card on your dashboard always reflects your latest entry.</p>
<p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;margin:0;">Questions? Reply to this email or write to <a href="mailto:lehumo@limepages.co.za" style="color:#46CDCF;text-decoration:none;">lehumo@limepages.co.za</a>.</p>
</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
<div style="font-size:11px;color:rgba(255,255,255,0.35);">Lehumo Collective Investment Trust</div></td></tr>
</table></td></tr></table></body></html>`,
  });
}

/**
 * Admin-side notification — fires alongside the member acknowledgement.
 * Sent to lehumo@limepages.co.za with the full submission so admin can
 * build the volunteer list before the kick-off QGM without polling
 * Airtable.
 */
export async function sendSteeringAdminNotification(params: {
  memberFullName: string;
  memberNumber: number;
  memberEmail: string;
  expertise: string;
  motivation: string;
  isUpdate: boolean;
}) {
  const { memberFullName, memberNumber, memberEmail, expertise, motivation, isUpdate } = params;
  const memberRef = formatMemberNumber(memberNumber);
  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: "lehumo@limepages.co.za",
    subject: isUpdate
      ? `[Admin] Steering Committee — ${memberRef} ${memberFullName} updated submission`
      : `[Admin] Steering Committee — ${memberRef} ${memberFullName} volunteered`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0B1933;">
<div style="max-width:560px;margin:32px auto;padding:0 20px;">
<div style="background:#FFFBEB;border-left:4px solid #F59E0B;padding:14px 18px;border-radius:6px;margin-bottom:20px;">
<div style="font-size:11px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Steering Committee &mdash; ${isUpdate ? "updated submission" : "new volunteer"}</div>
<div style="font-size:14px;color:#0B1933;line-height:1.6;">${escapeHtml(memberFullName)} &middot; <strong>${memberRef}</strong> &middot; <a href="mailto:${escapeHtml(memberEmail)}" style="color:#0B1933;">${escapeHtml(memberEmail)}</a></div>
</div>
<div style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:10px;padding:18px 22px;margin-bottom:14px;">
<div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">Expertise they bring</div>
<div style="font-size:14px;color:#0B0B0B;line-height:1.65;">${escapeHtml(expertise)}</div>
</div>
${motivation ? `<div style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:10px;padding:18px 22px;margin-bottom:14px;"><div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px;">Why they want to serve</div><div style="font-size:14px;color:#0B0B0B;line-height:1.65;">${escapeHtml(motivation)}</div></div>` : ""}
<p style="font-size:12px;color:#6B7280;line-height:1.7;margin:18px 0 0;">Submission also stored on the member&rsquo;s Airtable record under the <code style="background:#E5E7EB;padding:1px 5px;border-radius:3px;">Notes</code> field (segments <code>SteeringExpertise</code> / <code>SteeringMotivation</code> / <code>SteeringSubmittedAt</code>). The volunteer card on the member&rsquo;s portal lets them update or withdraw.</p>
</div></body></html>`,
  });
}

/**
 * Admin-side withdrawal notification. Lighter weight than the
 * submission notification — just announces the change so the volunteer
 * list stays accurate.
 */
export async function sendSteeringWithdrawAdminNotification(params: {
  memberFullName: string;
  memberNumber: number;
  memberEmail: string;
}) {
  const { memberFullName, memberNumber, memberEmail } = params;
  const memberRef = formatMemberNumber(memberNumber);
  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: "lehumo@limepages.co.za",
    subject: `[Admin] Steering Committee — ${memberRef} ${memberFullName} withdrew`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0B1933;">
<div style="max-width:560px;margin:32px auto;padding:0 20px;">
<div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:14px 18px;border-radius:6px;">
<div style="font-size:11px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Steering Committee &mdash; withdrawal</div>
<div style="font-size:14px;color:#0B1933;line-height:1.6;">${escapeHtml(memberFullName)} &middot; <strong>${memberRef}</strong> &middot; <a href="mailto:${escapeHtml(memberEmail)}" style="color:#0B1933;">${escapeHtml(memberEmail)}</a> has withdrawn their volunteer submission.</div>
</div>
</div></body></html>`,
  });
}

/* ─── Password reset magic link ─── */
/**
 * Email a member a 15-minute magic link to reset their portal password.
 *
 * The link's token carries the memberId + purpose claim, signed with
 * SESSION_SECRET so it can't be forged. The route handler that consumes
 * the link also re-checks the member number (we collected it on the
 * forgot form) before applying the new password — defence-in-depth so
 * a forwarded inbox alone doesn't grant account takeover.
 *
 * BCC'd to lehumo@limepages.co.za like every other transactional send
 * so admin has the audit trail.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  const { to, fullName, memberNumber, resetUrl, expiresInMinutes } = params;
  const firstName = fullName.split(" ")[0] || "there";
  const resend = getResend();

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: `Reset your Lehumo portal password — ${formatMemberNumber(memberNumber)}`,
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
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
              <div style="font-size:13px;color:#46CDCF;margin-top:4px;">Collective Investment Trust</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;">Hi ${firstName},</h1>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 24px;">
                You (or someone using your email) asked to reset the password
                on your Lehumo portal account
                <strong style="color:#B8FF00;">${formatMemberNumber(memberNumber)}</strong>.
                Click below to pick a new one. This link expires in
                <strong style="color:#ffffff;">${expiresInMinutes} minutes</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${resetUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;">
                      Reset password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(70,205,207,0.06);border:1px solid rgba(70,205,207,0.2);border-radius:14px;margin-bottom:8px;">
                <tr>
                  <td style="padding:16px 20px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;">
                    <strong style="color:#46CDCF;">Didn&rsquo;t request this?</strong>
                    Ignore this email &mdash; your password stays unchanged. Your
                    existing member-number login also continues to work either way.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:0;line-height:1.6;">
                If the button doesn&rsquo;t work, copy this link into your browser:<br/>
                <span style="color:rgba(70,205,207,0.7);word-break:break-all;">${resetUrl}</span>
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
