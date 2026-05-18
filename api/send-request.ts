import { sendMail } from "../services/mailHandler";

export default async function handler(req: any, res: any) {
  // Add CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for environment variables
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("Missing SMTP credentials in environment variables");
    return res.status(500).json({ 
      error: "SMTP credentials are not configured on the server. Please set SMTP_USER and SMTP_PASS in your Vercel project environment variables." 
    });
  }

  try {
    const result = await sendMail(req.body);
    return res.status(200).json({ success: true, message: "Email sent successfully", info: result });
  } catch (error: any) {
    console.error("Error in send-request handler:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred while sending the email. Check function logs for details.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
