import nodemailer from "nodemailer";

export async function sendMail(body: any) {
  const { name, email, phone, location, additionalNote, packageSummary, investment } = body;

  const SMTP_HOST = process.env.SMTP_HOST || "smtp.mailersend.net";
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "digitalin.studio@gmail.com";

  if (!SMTP_USER || !SMTP_PASS) {
    const missing = [];
    if (!SMTP_USER) missing.push("SMTP_USER");
    if (!SMTP_PASS) missing.push("SMTP_PASS");
    console.error(`Missing SMTP configuration: ${missing.join(", ")}`);
    throw new Error(`SMTP credentials are not configured (${missing.join(", ")}). Please add them to Vercel Environment Variables.`);
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"ZLaTkoM" <${SMTP_USER}>`,
    to: CONTACT_EMAIL,
    replyTo: email,
    subject: `New Booking Request from ${name}`,
    text: `
      New Booking Request Details:
      ---------------------------
      Full Name: ${name}
      Email: ${email}
      Phone: ${phone || 'Not provided'}
      Location: ${location || 'Not provided'}
      
      Package Summary:
      ${packageSummary}
      
      Total Investment: ${investment} €
      
      Additional Note:
      ${additionalNote || 'None'}
    `,
    html: `
      <h3>New Booking Request Details</h3>
      <p><strong>Full Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Location:</strong> ${location || 'Not provided'}</p>
      <br/>
      <h4>Package Summary:</h4>
      <p style="white-space: pre-wrap;">${packageSummary}</p>
      <br/>
      <p><strong>Total Investment:</strong> ${investment} €</p>
      <br/>
      <h4>Additional Note:</h4>
      <p>${additionalNote || 'None'}</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
}
