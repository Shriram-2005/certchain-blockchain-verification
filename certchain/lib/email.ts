import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

interface SendCertificateEmailParams {
  to:          string;
  holderName:  string;
  certId:      string;
  certType:    string;
  institution: string;
  issuedAt:    string;
  pdfUrl:      string;  // Supabase Storage public URL
  txHash:      string;  // Ethereum transaction hash
}

export async function sendCertificateEmail(params: SendCertificateEmailParams) {
  const etherscanUrl = `https://sepolia.etherscan.io/tx/${params.txHash}`;
  const verifyUrl    = `${process.env.NEXT_PUBLIC_APP_URL}/verify?id=${params.certId}`;

  const { data, error } = await resend.emails.send({
    from:    "CertChain <certificates@resend.dev>",
    to:      [params.to],
    subject: `Your ${params.certType} Certificate is Ready — ${params.certId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
          
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1e293b; margin: 0;">🔐 CertChain</h1>
            <p style="color: #64748b; margin: 4px 0 0;">Blockchain-Verified Certificate</p>
          </div>

          <p style="color: #334155;">Dear <strong>${params.holderName}</strong>,</p>
          
          <p style="color: #334155;">
            Your <strong>${params.certType}</strong> certificate from 
            <strong>${params.institution}</strong> has been successfully issued 
            and anchored on the Ethereum blockchain.
          </p>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-weight: bold;">✅ Certificate Details</p>
            <p style="margin: 8px 0 0; color: #166534;">Certificate ID: <code>${params.certId}</code></p>
            <p style="margin: 4px 0 0; color: #166534;">Issued: ${params.issuedAt}</p>
          </div>

          <div style="margin: 24px 0;">
            <a href="${params.pdfUrl}" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 12px;">
              📄 Download Certificate
            </a>
            <a href="${verifyUrl}" 
               style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              🔍 Verify Online
            </a>
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px;">
            <p style="margin: 0; color: #64748b; font-size: 13px;">
              🔗 <a href="${etherscanUrl}" style="color: #3b82f6;">View on Etherscan (Blockchain Proof)</a>
            </p>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 13px;">
              Transaction: <code style="font-size: 11px;">${params.txHash}</code>
            </p>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center;">
            This certificate is permanently recorded on the Ethereum Sepolia network 
            and can be verified by anyone at any time.
          </p>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error("Email send error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
