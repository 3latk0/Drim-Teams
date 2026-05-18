import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, location, additionalNote, packageSummary, investment } = req.body;

  // Validate Environment Variables
  const SMTP_HOST = process.env.SMTP_HOST || "smtp.mailersend.net";
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "digitalin.studio@gmail.com";

  if (!SMTP_USER || !SMTP_PASS) {
    console.error("Vercel Deployment Error: Missing SMTP_USER or SMTP_PASS environment variables.");
    return res.status(500).json({ 
      error: "Server configuration error: SMTP credentials are missing. Please add SMTP_USER and SMTP_PASS to your Vercel Project Settings -> Environment Variables." 
    });
  }

  try {
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
        <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
          <h2 style="color: #333;">New Booking Request</h2>
          <p><strong>Full Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Location:</strong> ${location || 'Not provided'}</p>
          <hr/>
          <h3>Package Summary:</h3>
          <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px;">${packageSummary}</p>
          <p><strong>Total Investment:</strong> ${investment} €</p>
          <hr/>
          <h3>Additional Note:</h3>
          <p>${additionalNote || 'None'}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Nodemailer Error on Vercel:", error);
    return res.status(500).json({ 
      error: "Failed to send email.",
      message: error.message
    });
  }
}
