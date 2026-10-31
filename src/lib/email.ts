// Transactional email via Resend's HTTP API (no SDK needed).
// Does nothing until RESEND_API_KEY and EMAIL_FROM are set, so the site
// works normally before the domain is verified.

type Mail = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: Mail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM; // e.g. "SRC e-solutions <noreply@srcesolutions.store>"
  if (!key || !from || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("[email] Resend rejected the email:", res.status, await res.text());
  } catch (err) {
    console.error("[email] could not reach Resend:", err);
  }
}

// Student-typed text goes into HTML: escape it so nobody can inject links or markup
export const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const siteUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const layout = (body: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #16233A;">
    <p style="font-size: 20px; font-weight: 800; margin: 0 0 16px;">SRC <span style="font-weight: 400; color: #5B6B84;">e-solutions</span></p>
    ${body}
  </div>`;

// To bhaiya: a new request arrived
export function newRequestAlert(r: {
  refCode: string; studentName: string; college: string; phone: string; whatsapp?: string; email: string;
  category: string; title: string; deadline: string; budgetBand: string; description: string;
}) {
  return {
    subject: `New request ${r.refCode}: ${r.title}`.slice(0, 150),
    html: layout(`
      <h2 style="margin: 0 0 12px;">New project request</h2>
      <p><strong>Ref code:</strong> ${esc(r.refCode)}</p>
      <p><strong>Student:</strong> ${esc(r.studentName)} (${esc(r.college)})</p>
      <p><strong>Phone / WhatsApp:</strong> ${esc(r.phone)} / ${esc(r.whatsapp || r.phone)}</p>
      <p><strong>Email:</strong> ${esc(r.email)}</p>
      <p><strong>Category:</strong> ${esc(r.category)}</p>
      <p><strong>Title:</strong> ${esc(r.title)}</p>
      <p><strong>Deadline:</strong> ${esc(new Date(r.deadline).toLocaleDateString("en-GB"))}</p>
      <p><strong>Budget:</strong> ${esc(r.budgetBand)}</p>
      <p><strong>Description:</strong></p>
      <div style="background: #F3F4F6; padding: 14px; border-radius: 8px; white-space: pre-wrap;">${esc(r.description)}</div>
      <p style="margin-top: 20px;"><a href="${siteUrl()}/x9" style="display: inline-block; padding: 12px 22px; background: #16233A; color: #fff; text-decoration: none; border-radius: 999px; font-weight: bold;">Open dashboard</a></p>
    `),
  };
}

// To the student: we got it (no contact details, only the tracking link)
export function requestConfirmation(r: { refCode: string; studentName: string; title: string }) {
  const track = `${siteUrl()}/status/${encodeURIComponent(r.refCode)}`;
  return {
    subject: `We got your project request (${r.refCode})`,
    html: layout(`
      <h2 style="margin: 0 0 12px;">Request received ✅</h2>
      <p>Hi ${esc(r.studentName)},</p>
      <p>Thanks for sending <strong>${esc(r.title)}</strong>. We read every request ourselves, usually within 2–3 working days. If we can take it up, we'll get in touch on the number you gave.</p>
      <p style="margin: 20px 0 6px;">Your reference code:</p>
      <p style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 3px; background: #FFF4C2; display: inline-block; padding: 8px 14px; border-radius: 8px; margin: 0;">${esc(r.refCode)}</p>
      <p style="margin-top: 20px;"><a href="${track}" style="display: inline-block; padding: 12px 22px; background: #FFD43B; color: #16233A; text-decoration: none; border-radius: 999px; font-weight: bold;">Track my project</a></p>
      <p style="color: #5B6B84; font-size: 13px; margin-top: 28px;">This is an automatic email. Replies to this address are not read. Use the tracking link above to check your project anytime.</p>
    `),
  };
}
