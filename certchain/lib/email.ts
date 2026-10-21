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
  appUrl?:     string;     // Base application URL
}

export async function sendCertificateEmail(params: SendCertificateEmailParams) {
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${params.txHash}`;
  const baseUrl = params.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl.replace(/\/$/, "")}/verify?id=${encodeURIComponent(params.certId)}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Official Credential Conferment</title>
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        body { margin: 0; padding: 0; width: 100% !important; background-color: #070b14; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        @media only screen and (max-width: 600px) {
          .email-wrapper { padding: 8px !important; }
          .email-content { padding: 22px 16px !important; }
          .btn-block { display: block !important; width: 100% !important; box-sizing: border-box !important; margin: 0 0 10px 0 !important; text-align: center !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #070b14;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #070b14; padding: 28px 12px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #0d1527; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.5);">
              
              <!-- Brand Header -->
              <tr>
                <td style="padding: 28px 24px 20px; border-bottom: 1px solid #1e293b; text-align: center; background-color: #0a1120;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                    <tr>
                      <td style="background-color: #1e3a8a; border: 1px solid #3b82f6; border-radius: 8px; width: 32px; height: 32px; text-align: center; vertical-align: middle; color: #60a5fa; font-weight: bold; font-size: 14px;">
                        CC
                      </td>
                      <td style="padding-left: 10px; text-align: left;">
                        <span style="font-size: 17px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; display: block;">CertChain Protocol</span>
                        <span style="font-size: 11px; color: #64748b; font-weight: 500; display: block;">Decentralized Credential Ledger</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td class="email-content" style="padding: 30px 28px;">
                  <p style="color: #f1f5f9; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                    Dear ${params.holderName},
                  </p>
                  
                  <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                    Your official <strong style="color: #ffffff;">${params.certType}</strong> credential from 
                    <strong style="color: #ffffff;">${params.institution}</strong> has been authenticated and permanently recorded to the Ethereum Sepolia blockchain.
                  </p>

                  <!-- Credential Details Box -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070d1a; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 18px;">
                        <div style="font-size: 10px; font-weight: 700; color: #38bdf8; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">Credential Records</div>
                        
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
                          <tr>
                            <td style="color: #64748b; padding-bottom: 8px; width: 40%;">Certificate ID:</td>
                            <td style="color: #38bdf8; font-family: monospace; font-weight: 700; padding-bottom: 8px;">${params.certId}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b; padding-bottom: 8px;">Issuing Body:</td>
                            <td style="color: #e2e8f0; font-weight: 600; padding-bottom: 8px;">${params.institution}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b; padding-bottom: 8px;">Credential Class:</td>
                            <td style="color: #e2e8f0; font-weight: 600; padding-bottom: 8px;">${params.certType}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b;">Conferment Date:</td>
                            <td style="color: #e2e8f0; font-weight: 600;">${params.issuedAt}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Primary Action Buttons -->
                  <div style="text-align: center; margin: 26px 0 20px 0;">
                    <a href="${etherscanUrl}" target="_blank" rel="noopener noreferrer" class="btn-block"
                       style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 13px 22px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; margin: 4px; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
                      Inspect on Ethereum Blockchain
                    </a>

                    <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" class="btn-block"
                       style="display: inline-block; background-color: #1e293b; color: #f1f5f9; border: 1px solid #334155; padding: 13px 22px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; margin: 4px;">
                      Open CertChain Verifier
                    </a>

                    ${params.pdfUrl ? `
                      <a href="${params.pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-block"
                         style="display: inline-block; background-color: #0f172a; color: #38bdf8; border: 1px solid #0284c7; padding: 13px 22px; border-radius: 10px; font-size: 13px; font-weight: 600; text-decoration: none; margin: 4px;">
                        Download Official PDF
                      </a>
                    ` : ""}
                  </div>

                  <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 18px 0 0 0; text-align: center;">
                    Your official certificate PDF with embedded QR code is also attached directly to this email.
                  </p>

                  <!-- Blockchain Telemetry Box -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070d1a; border: 1px solid #1e293b; border-radius: 10px; margin-top: 24px;">
                    <tr>
                      <td style="padding: 14px 16px;">
                        <div style="font-size: 10px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">Ethereum Sepolia State Proof</div>
                        <div style="margin-top: 6px; font-size: 11px; word-break: break-all; font-family: monospace; color: #94a3b8; line-height: 1.4;">
                          Tx: ${params.txHash}
                        </div>
                        <div style="margin-top: 6px; font-size: 11px; word-break: break-all; font-family: monospace; color: #64748b;">
                          Contract: 0xfbE80a8e42a9c141f615A82EFf3c1403Ce4f5E95
                        </div>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #070b14; border-top: 1px solid #1e293b; padding: 20px; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
                  This digital credential is cryptographically anchored to Ethereum Sepolia and cannot be altered, deleted, or backdated.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
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
