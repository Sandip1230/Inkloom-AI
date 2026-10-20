// sendEmail.js
// Render's FREE web services block outbound SMTP ports (25, 465, 587) since Sep 2025,
// so Gmail/SMTP will never connect from a free-tier deploy. We send via Brevo's HTTP API
// instead (goes over HTTPS/443, which is not blocked). No extra npm install needed —
// Node >= 18 has native fetch.

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!apiKey || !fromEmail) {
    console.log(`[email] BREVO_API_KEY/EMAIL_FROM not configured - would send to ${to}:\nSubject: ${subject}\n${text}`);
    return { delivered: false };
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: 'Brandloom' },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html || `<p>${text}</p>`,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(`[email] Brevo API error (${res.status}): ${errBody}`);
    throw new Error(`Failed to send email: ${res.status}`);
  }

  return { delivered: true };
}

module.exports = { sendEmail };