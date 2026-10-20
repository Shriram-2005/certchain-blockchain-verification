import nodemailer from "nodemailer";
import { Resend } from "resend";

interface SendCertificateEmailParams {
  to:          string;
  holderName:  string;
  certId:      string;
  certType:    string;
  institution: string;
  issuedAt:    string;
  pdfUrl?:     string;     // Supabase Storage public URL
  pdfBuffer?:  Buffer;     // Raw PDF buffer to attach directly
  txHash:      string;     // Ethereum transaction hash
}

export async function sendCertificateEmail(params: SendCertificateEmailParams) {
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${params.txHash}`;
  const verifyUrl    = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify?id=${encodeURIComponent(params.certId)}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Official Certificate Conferment</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background: #0f172a; color: #334155;">
      <div style="background: #ffffff; border-radius: 16px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 22px; letter-spacing: -0.5px;">CertChain Protocol</h2>
          <p style="color: #64748b; margin: 6px 0 0; font-size: 13px; font-weight: 500;">Decentralized Credential Verification Ledger</p>
        </div>

        <p style="color: #1e293b; font-size: 15px; margin-top: 0;">Dear <strong>${params.holderName}</strong>,</p>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your official <strong>${params.certType}</strong> credential from 
          <strong>${params.institution}</strong> has been successfully minted and anchored to the Ethereum Sepolia blockchain.
        </p>

        <!-- Certificate Details Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">Credential Records</div>
          <div style="font-size: 13px; color: #334155; margin-bottom: 6px;">Certificate ID: <strong style="font-family: monospace; color: #0f172a;">${params.certId}</strong></div>
          <div style="font-size: 13px; color: #334155; margin-bottom: 6px;">Issuing Body: <strong>${params.institution}</strong></div>
          <div style="font-size: 13px; color: #334155;">Conferment Date: <strong>${params.issuedAt}</strong></div>
        </div>

        <!-- Action Buttons -->
        <div style="margin: 28px 0; text-align: center;">
          ${params.pdfUrl ? `
            <a href="${params.pdfUrl}" 
               style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; margin-right: 10px; margin-bottom: 8px;">
              Download Official PDF
            </a>
          ` : ""}
          <a href="${verifyUrl}" 
             style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; margin-bottom: 8px;">
            Verify Live on Blockchain
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 16px;">
          Note: Your official certificate PDF with embedded cryptographic QR code is also attached directly to this email.
        </p>

        <!-- Blockchain Telemetry -->
        <div style="background: #f1f5f9; border-radius: 10px; padding: 16px; margin-top: 24px;">
          <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Ethereum State Proof</div>
          <div style="margin-top: 6px; font-size: 11px; word-break: break-all; font-family: monospace; color: #334155;">
            Tx: ${params.txHash}
          </div>
          <div style="margin-top: 8px;">
            <a href="${etherscanUrl}" style="color: #2563eb; font-size: 12px; font-weight: 600; text-decoration: none;">
              Inspect on Etherscan &rarr;
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; margin-top: 28px; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
          This record is cryptographically immutable and permanently verifiable without third-party reliance.
        </div>
      </div>
    </body>
    </html>
  `;

  // ── Strategy A: Gmail SMTP (Send to ANY recipient in the world) ────────────
  let gmailUser = process.env.GMAIL_USER;
  let gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const match = line.match(/^([^#=]+)=(.*)$/);
          if (match) {
            const k = match[1].trim();
            const v = match[2].trim();
            if (k === "GMAIL_USER" && !gmailUser) gmailUser = v;
            if (k === "GMAIL_APP_PASSWORD" && !gmailPass) gmailPass = v;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const attachments = params.pdfBuffer
        ? [
            {
              filename: `${params.certId}.pdf`,
              content: params.pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : [];

      const info = await transporter.sendMail({
        from: `"CertChain Authority" <${gmailUser}>`,
        to: params.to,
        subject: `Official Credential Conferment: ${params.certId} — ${params.institution}`,
        html: emailHtml,
        attachments,
      });

      console.log("Email delivered via Gmail SMTP successfully. MessageId:", info.messageId);
      return { success: true, provider: "gmail", messageId: info.messageId };
    } catch (err: any) {
      console.error("Gmail SMTP error:", err?.message || err);
      // Fall through to Resend
    }
  }

  // ── Strategy B: Resend fallback ──────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: "CertChain <certificates@resend.dev>",
        to: [params.to],
        subject: `Your ${params.certType} Certificate is Ready — ${params.certId}`,
        html: emailHtml,
      });

      if (error) {
        console.warn("Resend email delivery skipped:", error.message);
        return { success: false, reason: error.message };
      }

      return { success: true, provider: "resend", data };
    } catch (err: any) {
      console.warn("Resend error:", err?.message || err);
    }
  }

  return { success: false, reason: "No email provider available" };
}
