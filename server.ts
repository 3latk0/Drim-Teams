import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import cors from "cors";

// SMTP credentials should ideally be in process.env
const SMTP_HOST = process.env.SMTP_HOST || "smtp.mailersend.net";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "digitalin.studio@gmail.com";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // API endpoint for sending emails
  app.post("/api/send-request", async (req, res) => {
    try {
      const { name, email, phone, location, additionalNote, packageSummary, investment } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Digital In Booking" <${SMTP_USER}>`,
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

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email. Please check server logs." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // In Express v5, you must use app.get('*all',
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
