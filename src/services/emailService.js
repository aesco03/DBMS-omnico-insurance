const { Resend } = require('resend');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendResetEmail(to, resetUrl, name) {
  const subject = 'OmniCoInsurance Password Reset';
  const from = process.env.RESEND_FROM || 'OmniCoInsurance <onboarding@resend.dev>';

  // Fallback HTML
  let html = `
    <p>Hi ${name || ''},</p>
    <p>We received a request to reset your OmniCoInsurance password.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you didn't request this, ignore this email.</p>
  `;

  // Load custom EJS template if it exists
  try {
    const tplPath = path.join(__dirname, '../../views/emails/reset_password.ejs');
    if (fs.existsSync(tplPath)) {
      const tpl = await fs.promises.readFile(tplPath, 'utf8');
      html = ejs.render(tpl, { name, resetUrl, siteName: 'OmniCoInsurance' });
    }
  } catch (err) {
    console.error('Error rendering reset email template:', err);
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send via Resend:", error);
      return;
    }

    console.log("Reset email sent via Resend:", data.id);
  } catch (err) {
    console.error("Resend API error:", err);
  }
}

module.exports = { sendResetEmail };
