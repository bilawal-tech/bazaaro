const nodemailer = require('nodemailer');

// SMTP se email bhejta hai. Gmail (App Password) ya Resend (smtp.resend.com)
// dono chalte hain, bas .env mein SMTP_* values badlo.
// SMTP set na ho aur NODE_ENV production na ho to email ki jagah console mein
// dikha deta hai, taake local par bina setup ke test ho sake.
let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP_HOST is not set');
    }
    console.log('\n[mailer] SMTP set nahi hai, email bheja nahi gaya. Content:');
    console.log(`  To: ${to}\n  Subject: ${subject}\n  ${text}\n`);
    return;
  }
  const from = process.env.EMAIL_FROM || `Bazaaro <${process.env.SMTP_USER}>`;
  await getTransporter().sendMail({ from, to, subject, text, html });
}

module.exports = { sendMail };
