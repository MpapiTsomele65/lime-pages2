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
<p style="font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;margin:0 0 20px;">${isUpdate ? "We&rsquo;ve updated your" : "We&rsquo;ve recorded your"} application for the Lehumo Executive Steering Governance Committee. A six-person committee will be confirmed at our <strong style="color:#fff;">Kick-off QGM on Wednesday, 24 June 2026</strong>. If more than six people volunteer, we&rsquo;ll run a quick election before then.</p>
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

/* ─── Pre-launch cohort update broadcast ─── */
/**
 * Pre-launch comms email — dashboard tracker + opt-in / opt-out
 * windows + portal CTAs. Broadcast to the full member + leads list
 * once, ~24-30 hrs before launch on 1 June 2026.
 *
 * Parameterised by the live cohort stats so the admin endpoint can
 * recompute them at send time. Pre-filled subscribe-out mailto link
 * so opt-outs are one click → typed reason → send.
 *
 * BCC'd to lehumo@limepages.co.za for audit (per-recipient BCC, so
 * each member who opens the email sees the same "lehumo BCC" trail
 * any admin investigation would expect).
 */
export interface PreLaunchStats {
  onboardedCount: number;
  onboardedPct: number;
  juneReceived: number;
  juneGoal: number;
  juneReceivedPct: number;
  governanceVolunteers: number;
  governanceTarget: number;
}

/**
 * Render the pre-launch email body to HTML. Exported separately so
 * both the send path and the admin preview endpoint use the exact
 * same template — no risk of the preview drifting from what actually
 * lands in members' inboxes.
 */
export function renderPreLaunchEmailHtml(params: {
  firstName: string;
  stats: PreLaunchStats;
}): string {
  const { firstName, stats } = params;
  const portalUrl = `${siteUrl()}/lehumo/portal`;

  // ZAR formatter for the contribution figures.
  const fmtZAR = (n: number) =>
    n.toLocaleString("en-ZA", { maximumFractionDigits: 0 });

  // ── Kick-off meeting details. ⚠️ CONFIRM these before broadcasting. ──
  // Update KICKOFF_TIME + the two ISO timestamps + the gcal UTC dates
  // together if the start time changes (SAST = UTC+2, so 18:00 → 16:00Z).
  const KICKOFF_DATE_LABEL = "Today · Wednesday 24 June 2026";
  const KICKOFF_TIME = "18h00–19h30 SAST";
  const KICKOFF_JOIN_URL = "https://meet.google.com/tkt-pfaa-zuk";
  const KICKOFF_START_ISO = "2026-06-24T18:00:00+02:00";
  const KICKOFF_END_ISO = "2026-06-24T19:30:00+02:00";
  const KICKOFF_GCAL =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent("Lehumo Kick-off — Quarterly General Meeting") +
    "&dates=20260624T160000Z/20260624T173000Z" +
    "&details=" +
    encodeURIComponent(
      "Lehumo Founding Bosses kick-off. Join: " +
        KICKOFF_JOIN_URL +
        " · Or dial (ZA) +27 10 823 1210, PIN 867 717 053#",
    ) +
    "&location=" +
    encodeURIComponent(KICKOFF_JOIN_URL);

  // Subscribe-out mailto — pre-filled subject + body so opt-outs are
  // one click → type member number → send. Encoded for safe URL use.
  const subscribeOutMailto =
    "mailto:lehumo@limepages.co.za" +
    "?subject=" +
    encodeURIComponent("Subscribe out — Lehumo Founding 30") +
    "&body=" +
    encodeURIComponent(
      "Hi Lehumo team,\n\n" +
        "I'd like to subscribe out of the Lehumo Founding 30 and release my membership slot.\n\n" +
        "Member number: [your member number]\n" +
        "Reason (optional): \n\n" +
        "Thanks.",
    );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0B1933;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!--
    Gmail Markup (schema.org Event) — surfaces the calendar widget at
    the top of the inbox view with "Add to calendar" / "Invite others"
    actions + automatic conflict detection against Google Calendar.
    Same trick used in the 28-May "5 days to launch" reminder that
    came through with the calendar card.

    EventReservation gives us the inviter affordances; nested Event
    carries the actual meeting metadata. VirtualLocation flags it as
    an online meeting so Gmail shows the meet link as the join
    target. SAST = UTC+02:00 year-round (no DST), so ISO dates
    encode the timezone offset directly without a VTIMEZONE.
  -->
  <script type="application/ld+json">
  {
    "@context": "http://schema.org",
    "@type": "EventReservation",
    "reservationNumber": "lehumo-kickoff-2026-06-24",
    "reservationStatus": "http://schema.org/ReservationConfirmed",
    "underName": {
      "@type": "Person",
      "name": "${firstName.replace(/[\\\\"]/g, " ")}"
    },
    "reservationFor": {
      "@type": "Event",
      "name": "Lehumo Kick-off — Quarterly General Meeting",
      "startDate": "${KICKOFF_START_ISO}",
      "endDate": "${KICKOFF_END_ISO}",
      "eventStatus": "http://schema.org/EventScheduled",
      "eventAttendanceMode": "http://schema.org/OnlineEventAttendanceMode",
      "location": {
        "@type": "VirtualLocation",
        "url": "${KICKOFF_JOIN_URL}"
      },
      "url": "${KICKOFF_JOIN_URL}",
      "description": "Lehumo Founding Bosses kick-off — the vision, the model, your protections, governance, and a live Q&A. Complete your registration before July to lock your founding seat.",
      "organizer": {
        "@type": "Organization",
        "name": "Lehumo Trust",
        "email": "lehumo@limepages.co.za",
        "url": "${siteUrl()}"
      }
    }
  }
  </script>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1933;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0F2040;border-radius:20px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">

        <tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:28px;font-weight:800;color:#B8FF00;letter-spacing:1px;">LEHUMO</div>
          <div style="font-size:13px;color:#46CDCF;margin-top:4px;">Collective Investment Trust</div>
        </td></tr>

        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0 0 8px;line-height:1.25;">Reminder &mdash; the kick-off meeting is tonight at 18h00</h1>
          <p style="font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;margin:0 0 24px;">
            Hi ${firstName}, a quick reminder that our <strong style="color:#ffffff;">Kick-off &amp; first Quarterly General Meeting</strong> is <strong style="color:#B8FF00;">tonight at 18h00</strong>. Tap the join link below to join us &mdash; we&rsquo;ll walk through the vision, how the pool works, your protections, governance, and take live questions. See you there.
          </p>
        </td></tr>

        <tr><td style="padding:0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(70,205,207,0.14) 0%,rgba(184,255,0,0.06) 100%);border:1.5px solid rgba(70,205,207,0.40);border-radius:18px;margin-bottom:24px;">
            <tr><td style="padding:22px 22px 24px;">
              <p style="font-size:11px;font-weight:700;color:#46CDCF;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Tonight &middot; Starts 18h00 SAST</p>
              <h2 style="font-size:18px;font-weight:700;color:#ffffff;margin:0 0 6px;line-height:1.35;">Lehumo Kick-off &mdash; Quarterly General Meeting</h2>
              <p style="font-size:13.5px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 14px;">
                <strong style="color:#B8FF00;">${KICKOFF_DATE_LABEL} &middot; ${KICKOFF_TIME}</strong><br/>
                Virtual &mdash; the vision, how the pool works, your protections, governance, and a live Q&amp;A. This is where we launch the founding cohort together.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;"><tr>
                <td style="padding-right:8px;">
                  <a href="${KICKOFF_JOIN_URL}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:13px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:50px;">Join the meeting &rarr;</a>
                </td>
                <td>
                  <a href="${KICKOFF_GCAL}" style="display:inline-block;background:transparent;color:#46CDCF;font-size:13px;font-weight:700;text-decoration:none;padding:10px 20px;border:1.5px solid rgba(70,205,207,0.5);border-radius:50px;">Add to calendar &rarr;</a>
                </td>
              </tr></table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:10px;margin-top:10px;">
                <tr><td style="padding:10px 14px;font-size:11.5px;color:rgba(255,255,255,0.55);line-height:1.6;">
                  Or dial in: <strong style="color:rgba(255,255,255,0.8);">(ZA) +27 10 823 1210</strong> &middot; PIN: <strong style="color:rgba(255,255,255,0.8);">867 717 053#</strong><br/>
                  More numbers: <a href="https://tel.meet/tkt-pfaa-zuk?pin=7478398472133" style="color:#46CDCF;text-decoration:none;">tel.meet/tkt-pfaa-zuk</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px;">
          <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">Cohort dashboard</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(184,255,0,0.06);border:1px solid rgba(184,255,0,0.20);border-radius:14px;margin-bottom:12px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:12px;color:rgba(255,255,255,0.55);">Members onboarded</td>
                <td style="font-size:13px;font-weight:700;color:#B8FF00;text-align:right;">${stats.onboardedCount} / 30</td>
              </tr></table>
              <div style="margin-top:10px;height:6px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;">
                <div style="height:6px;width:${stats.onboardedPct}%;background:linear-gradient(90deg,#46CDCF,#B8FF00);border-radius:99px;"></div>
              </div>
              <p style="font-size:11.5px;color:rgba(255,255,255,0.45);margin:8px 0 0;">Finalising the founding 30 — see the subscribe-out section below if you&rsquo;re stepping back.</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(70,205,207,0.06);border:1px solid rgba(70,205,207,0.20);border-radius:14px;margin-bottom:8px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:12px;color:rgba(255,255,255,0.55);">Contributed this month</td>
                <td style="font-size:13px;font-weight:700;color:#46CDCF;text-align:right;">R${fmtZAR(stats.juneReceived)} / R${fmtZAR(stats.juneGoal)}</td>
              </tr></table>
              <div style="margin-top:10px;height:6px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;">
                <div style="height:6px;width:${stats.juneReceivedPct}%;background:linear-gradient(90deg,#46CDCF,#B8FF00);border-radius:99px;"></div>
              </div>
              <p style="font-size:11.5px;color:rgba(255,255,255,0.45);margin:8px 0 0;">${stats.onboardedCount} founders onboarded &times; R1,000 &mdash; the cohort target for June.</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(184,255,0,0.12) 0%,rgba(70,205,207,0.06) 100%);border:1.5px solid rgba(184,255,0,0.35);border-radius:18px;margin-bottom:28px;">
            <tr><td style="padding:28px 24px;text-align:center;">
              <p style="font-size:11px;font-weight:700;color:#B8FF00;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Starts tonight &middot; 18h00 SAST</p>
              <h2 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 10px;line-height:1.3;">See you at 18h00</h2>
              <p style="font-size:14.5px;color:rgba(255,255,255,0.7);line-height:1.65;margin:0 0 20px;">
                We&rsquo;re <strong style="color:#B8FF00;">${stats.onboardedCount} of 30</strong> founders strong. Join from your phone or laptop &mdash; tap below at 18h00. If your registration or KYC is still open, you can finish it in your portal tonight too.
              </p>
              <a href="${KICKOFF_JOIN_URL}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:50px;box-shadow:0 4px 12px rgba(184,255,0,0.25);">Join the meeting &rarr;</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px;">
          <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">Before you join tonight &mdash; quick checklist</p>
          <ul style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;padding-left:20px;margin:0 0 24px;">
            <li><strong style="color:#ffffff;">Complete your registration</strong> at <a href="${siteUrl()}/lehumo/onboard" style="color:#46CDCF;text-decoration:none;">limepages.co.za/lehumo/onboard</a> if you haven&rsquo;t yet &mdash; it confirms your founding seat and takes about 2 minutes.</li>
            <li><strong style="color:#ffffff;">Upload your KYC documents</strong> (SA ID + proof of address). The deadline is 15 August 2026, but earlier is cleaner &mdash; your portal shows the countdown.</li>
            <li><strong style="color:#ffffff;">Take the new risk-profile quiz</strong> in your portal &mdash; six quick scenarios that help us shape how the pool is invested around the community.</li>
            <li><strong style="color:#ffffff;">Set a portal password</strong> (Security page, top-right of your dashboard) for added protection &mdash; optional but recommended.</li>
          </ul>
        </td></tr>

        <tr><td style="padding:0 32px;">
          <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">Important dates</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.85;">
              <strong style="color:#B8FF00;">Today, 24 June 2026 &middot; 18h00</strong> &mdash; Kick-off &amp; first Quarterly General Meeting (virtual &mdash; details above).<br/>
              <strong style="color:#B8FF00;">Tuesday, 30 June 2026</strong> &mdash; Final day to land your June contribution &amp; confirm your seat.<br/>
              <strong style="color:#B8FF00;">From 1 July 2026</strong> &mdash; July contributions due; the founding cohort moves forward together.<br/>
              <strong style="color:#46CDCF;">Saturday, 15 August 2026</strong> &mdash; KYC documentation deadline.
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px;">
          <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">Finalising the founding 30</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.25);border-radius:14px;margin-bottom:24px;">
            <tr><td style="padding:20px;font-size:13.5px;color:rgba(255,255,255,0.75);line-height:1.7;">
              We&rsquo;re locking the founding cohort now. If you&rsquo;ve decided not to proceed, please <strong style="color:#F59E0B;">subscribe out as soon as possible</strong> so we can release your seat to the waiting list &mdash; better than missing contributions and ending up in arrears.
              <br/><br/>
              <a href="${subscribeOutMailto}" style="display:inline-block;background:#F59E0B;color:#0B1933;font-size:13px;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:50px;margin-top:6px;">Subscribe out &rarr;</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:8px 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${portalUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:50px;">Sign in to your portal &rarr;</a>
          </td></tr></table>
          <p style="font-size:12px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;margin:16px 0 0;">Questions? Reply to this email or message <a href="mailto:lehumo@limepages.co.za" style="color:#46CDCF;text-decoration:none;">lehumo@limepages.co.za</a>.</p>
        </td></tr>

        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:0;line-height:1.6;">
            <a href="https://www.limepages.co.za" style="color:#46CDCF;text-decoration:none;">limepages.co.za</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Build the kick-off meeting as an iCalendar (.ics) INVITE.
 *
 * METHOD:REQUEST + an ATTENDEE line for the recipient is what turns this
 * from a plain attachment into a calendar invitation — Gmail shows the
 * "Yes / Maybe / No" RSVP + add-to-calendar card, Apple Mail and Outlook
 * surface the invite banner. RSVPs route back to the ORGANIZER inbox
 * (lehumo@limepages.co.za). Complements the schema.org markup in the body
 * (Gmail-only) and works in every client the markup doesn't.
 *
 * SAST is UTC+02:00 year-round (no DST) → 18:00 SAST = 16:00 UTC, so we
 * encode times in UTC (Z) and skip the VTIMEZONE block.
 */
function buildKickoffInviteIcs(firstName: string, toEmail: string): string {
  const MEET_LINK = "https://meet.google.com/tkt-pfaa-zuk";
  const fmtUtc = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const start = new Date("2026-06-24T18:00:00+02:00");
  const end = new Date("2026-06-24T19:30:00+02:00");
  const dtstamp = fmtUtc(new Date());
  // Stable UID so a re-send (or a later update) lands as the same event in
  // the member's calendar rather than a duplicate.
  const uid = "lehumo-kickoff-qgm-2026-06-24@limepages.co.za";

  // RFC 5545 text escaping: backslash, semicolon, comma, newline.
  const esc = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  const description = esc(
    [
      "Lehumo Kick-off & first Quarterly General Meeting.",
      "",
      "We'll walk through the vision, how the pool works, your protections, governance, and take live questions.",
      "",
      `Google Meet: ${MEET_LINK}`,
      "Dial in: (ZA) +27 10 823 1210, PIN: 867 717 053#",
      "More phone numbers: https://tel.meet/tkt-pfaa-zuk?pin=7478398472133",
    ].join("\n"),
  );

  // CN param value can't carry commas / semicolons / quotes unescaped.
  const cn = (firstName || "Lehumo member").replace(/[\r\n,;:"\\]/g, " ").trim();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lime Pages//Lehumo Kick-off QGM//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${fmtUtc(start)}`,
    `DTEND:${fmtUtc(end)}`,
    "SEQUENCE:0",
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    `SUMMARY:${esc("Lehumo Kick-off — Quarterly General Meeting")}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${esc(MEET_LINK)}`,
    "ORGANIZER;CN=Lehumo Trust:MAILTO:lehumo@limepages.co.za",
    `ATTENDEE;CN=${cn};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:MAILTO:${toEmail}`,
    // 30-minute heads-up before the meeting starts.
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lehumo kick-off starts in 30 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

export async function sendPreLaunchEmail(params: {
  to: string;
  firstName: string;
  stats: PreLaunchStats;
}) {
  const { to, firstName, stats } = params;
  const resend = getResend();
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: "Reminder: Lehumo kick-off meeting is tonight at 18h00 🌱",
    html: renderPreLaunchEmailHtml({ firstName, stats }),
    // Calendar invite — renders as an "add to calendar" / RSVP card in
    // Gmail, Apple Mail, and Outlook. Per-recipient so each member is the
    // named ATTENDEE on their own invite.
    attachments: [
      {
        filename: "lehumo-kickoff.ics",
        content: Buffer.from(buildKickoffInviteIcs(firstName, to), "utf-8"),
        contentType: "text/calendar; charset=utf-8; method=REQUEST",
      },
    ],
  });
}

/* ─── Password set / changed / removed notification ─── */
/**
 * Notify the member when their portal password state changes.
 *
 * Banks send these because they're the canary in the coal mine: if an
 * attacker compromises a session and silently rotates the credential,
 * the email is the only signal the real owner sees. Same logic here —
 * we send for all three state transitions (set / changed / removed)
 * with explicit subject lines so a glance at the inbox tells the
 * member what happened without opening anything.
 *
 * BCC to lehumo@limepages.co.za for the audit trail (same as every
 * other transactional send). If support ever has to investigate "I
 * didn't set that password", the timestamped BCC in the lehumo@
 * inbox is the receipt.
 *
 * Failure is non-blocking: callers fire-and-forget so a Resend
 * outage doesn't break the password change itself. The user's
 * credential state is already persisted by the time we send.
 */
/**
 * Admin alert — fired by the orphan-scan cron when it finds contribution
 * rows whose Member link is blank or mis-linked (invisible to the rollup,
 * distorts pool totals). Plain-text so it's diagnosable at a glance.
 */
export async function sendOrphanScanAlert(scan: {
  affected: {
    memberNumber: number;
    memberName: string;
    blankCount: number;
    mismatched: { period: string; linkedTo: string }[];
  }[];
  totalBlank: number;
  totalMismatched: number;
}) {
  const resend = getResend();
  const lines = scan.affected
    .map((a) => {
      const num = `Leh${String(a.memberNumber).padStart(2, "0")}`;
      const parts = [`${a.blankCount} blank-link`];
      if (a.mismatched.length) {
        parts.push(
          `${a.mismatched.length} mis-linked (${a.mismatched
            .map((m) => m.period)
            .join(", ")})`,
        );
      }
      return `- ${num} ${a.memberName}: ${parts.join(", ")}`;
    })
    .join("\n");
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_BCC,
    subject: `Lehumo: ${scan.affected.length} member(s) with orphaned contribution rows`,
    text:
      `The orphan-scan found contribution rows whose Member link is blank or ` +
      `mis-linked. These are invisible to the admin rollup and distort the ` +
      `pool totals.\n\n${lines}\n\nTotals: ${scan.totalBlank} blank, ` +
      `${scan.totalMismatched} mis-linked.\n\nFix: run ` +
      `scripts/repair-orphan-links.ts --execute (auto-fixes blanks; review ` +
      `mis-links manually).`,
  });
}

export async function sendPasswordChangedEmail(params: {
  to: string;
  fullName: string;
  memberNumber: number;
  /** Which state transition just happened. Drives subject + body copy. */
  kind: "set" | "changed" | "removed";
}) {
  const { to, fullName, memberNumber, kind } = params;
  const firstName = fullName.split(" ")[0] || "there";
  const securityUrl = `${siteUrl()}/lehumo/portal/security`;
  const resend = getResend();

  // SAST timestamp so the body reads as the time the member would
  // recognise (not UTC). Format: "30 May 2026, 14:32".
  const nowSast = new Date().toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const verbPast =
    kind === "set" ? "set" : kind === "changed" ? "changed" : "removed";
  const verbHeadline =
    kind === "set"
      ? "Your Lehumo password was set"
      : kind === "changed"
        ? "Your Lehumo password was changed"
        : "Your Lehumo password was removed";

  const bodyLead =
    kind === "set"
      ? "You just set a password on your Lehumo portal account. From now on, you&rsquo;ll sign in with email + password instead of email + member number."
      : kind === "changed"
        ? "You just changed the password on your Lehumo portal account. Your old password no longer works."
        : "You just removed the password from your Lehumo portal account. You&rsquo;ll sign in with email + member number again until you set a new password.";

  const tipColour = kind === "removed" ? "#F59E0B" : "#46CDCF";
  const tipBg =
    kind === "removed" ? "rgba(245,158,11,0.06)" : "rgba(70,205,207,0.06)";
  const tipBorder =
    kind === "removed" ? "rgba(245,158,11,0.25)" : "rgba(70,205,207,0.2)";

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    bcc: ADMIN_BCC,
    subject: `${verbHeadline} — ${formatMemberNumber(memberNumber)}`,
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
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 20px;">
                ${bodyLead}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0" style="width:100%;">
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Account</td>
                        <td style="font-size:13px;font-weight:600;color:#B8FF00;padding:4px 0;text-align:right;">${formatMemberNumber(memberNumber)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Email</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${to}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">When</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">${nowSast} SAST</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:rgba(255,255,255,0.45);padding:4px 0;">Action</td>
                        <td style="font-size:13px;font-weight:600;color:#ffffff;padding:4px 0;text-align:right;">Password ${verbPast}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${tipBg};border:1px solid ${tipBorder};border-radius:14px;margin-bottom:8px;">
                <tr>
                  <td style="padding:16px 20px;font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;">
                    <strong style="color:${tipColour};">Didn&rsquo;t do this?</strong>
                    Email <a href="mailto:lehumo@limepages.co.za" style="color:#46CDCF;text-decoration:none;">lehumo@limepages.co.za</a> immediately
                    and we&rsquo;ll lock your account while we investigate.
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td align="center" style="padding:4px 0;">
                    <a href="${securityUrl}" style="display:inline-block;background:#B8FF00;color:#0B1933;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:50px;">
                      Manage security &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:0;line-height:1.6;">
                This is a security notification. We send it every time the portal password is set, changed, or removed.<br/>
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
