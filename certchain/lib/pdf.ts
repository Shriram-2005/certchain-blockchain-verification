import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export interface CertPdfParams {
  certId: string;
  holderName: string;
  certType: string;
  institution: string;
  degree?: string;
  grade?: string;
  year?: string | number;
  issuedAt: string;
  certHash: string;
  txHash?: string;
  uploadedDocBase64?: string;
  appUrl?: string;
}

export async function generateCertificatePdf(params: CertPdfParams): Promise<Buffer> {
  const baseUrl = params.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl.replace(/\/$/, "")}/verify?id=${encodeURIComponent(params.certId)}`;

  // 1. Generate QR Code as PNG Buffer
  const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 200,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  // 2. Create PDF document using pure JS pdf-lib (zero filesystem .afm dependency)
  const pdfDoc = await PDFDocument.create();
  // Landscape A4: 841.89 x 595.28 points
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  // Embed standard fonts (built-in, never requires .afm file reads from disk)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // Embed QR Code
  const qrImage = await pdfDoc.embedPng(qrPngBuffer);

  // ── Colors ──────────────────────────────────────────────────
  const cPaper = rgb(0.985, 0.99, 0.995);
  const cNavy = rgb(0.06, 0.09, 0.16);
  const cGold = rgb(0.85, 0.47, 0.02);
  const cBlue = rgb(0.15, 0.39, 0.92);
  const cSlate = rgb(0.28, 0.33, 0.41);
  const cMuted = rgb(0.45, 0.52, 0.62);

  // ── Background & Borders ────────────────────────────────────
  // Page background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: cPaper,
  });

  // Outer primary border (Navy)
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: cNavy,
    borderWidth: 3.5,
  });

  // Inner decorative border (Amber / Gold)
  page.drawRectangle({
    x: 26,
    y: 26,
    width: width - 52,
    height: height - 52,
    borderColor: cGold,
    borderWidth: 1.5,
  });

  // ── Helper for centered text ────────────────────────────────
  const drawCenteredText = (text: string, yFromTop: number, size: number, font = fontRegular, color = cNavy) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height - yFromTop,
      size,
      font,
      color,
    });
  };

  // ── Header Section ──────────────────────────────────────────
  drawCenteredText("CERTCHAIN DECENTRALIZED CREDENTIAL PROTOCOL", 55, 11, fontBold, cBlue);
  drawCenteredText(params.institution.toUpperCase(), 85, 24, fontBold, cNavy);
  drawCenteredText("OFFICIAL VERIFIABLE DEGREE CREDENTIAL", 115, 10, fontRegular, cMuted);

  // Center accent line
  page.drawLine({
    start: { x: width / 2 - 140, y: height - 130 },
    end: { x: width / 2 + 140, y: height - 130 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  // ── Body Section ────────────────────────────────────────────
  drawCenteredText("This official credential confirms that", 160, 12, fontRegular, cSlate);

  // Candidate Name
  drawCenteredText(params.holderName, 200, 28, fontBold, rgb(0.12, 0.23, 0.54));

  drawCenteredText("has fulfilled all academic requirements and curriculum standards and is hereby awarded", 240, 12, fontRegular, cSlate);

  // Degree Title
  drawCenteredText(params.degree || params.certType, 275, 20, fontBold, cNavy);

  if (params.grade) {
    drawCenteredText(`Graduation Standing: ${params.grade}`, 305, 12, fontRegular, cSlate);
  }

  // ── Bottom Section: Proof Metadata & QR Code ────────────────
  const footerBoxX = 50;
  const footerBoxY = 40;
  const footerBoxW = 540;
  const footerBoxH = 135;

  // Metadata Card
  page.drawRectangle({
    x: footerBoxX,
    y: footerBoxY,
    width: footerBoxW,
    height: footerBoxH,
    color: rgb(0.94, 0.96, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText("ON-CHAIN CRYPTOGRAPHIC VERIFICATION PROOF", {
    x: footerBoxX + 16,
    y: footerBoxY + footerBoxH - 22,
    size: 9.5,
    font: fontBold,
    color: cNavy,
  });

  page.drawText(`Certificate Identifier: ${params.certId}`, {
    x: footerBoxX + 16,
    y: footerBoxY + footerBoxH - 42,
    size: 8.5,
    font: fontBold,
    color: cBlue,
  });

  page.drawText(`Keccak-256 Hash:`, {
    x: footerBoxX + 16,
    y: footerBoxY + footerBoxH - 60,
    size: 8,
    font: fontRegular,
    color: cSlate,
  });
  page.drawText(params.certHash, {
    x: footerBoxX + 110,
    y: footerBoxY + footerBoxH - 60,
    size: 7.5,
    font: fontMono,
    color: cNavy,
  });

  const displayTx = params.txHash || "0x0000000000000000000000000000000000000000";
  page.drawText(`Ethereum Sepolia Tx:`, {
    x: footerBoxX + 16,
    y: footerBoxY + footerBoxH - 78,
    size: 8,
    font: fontRegular,
    color: cSlate,
  });
  page.drawText(displayTx.substring(0, 48) + "...", {
    x: footerBoxX + 110,
    y: footerBoxY + footerBoxH - 78,
    size: 7.5,
    font: fontMono,
    color: cNavy,
  });

  page.drawText(`Conferment Date: ${params.issuedAt}`, {
    x: footerBoxX + 16,
    y: footerBoxY + footerBoxH - 96,
    size: 8,
    font: fontBold,
    color: cNavy,
  });

  page.drawText("Smart Contract: 0xfbE80a8e42a9c141f615A82EFf3c1403Ce4f5E95 (CertificateRegistry)", {
    x: footerBoxX + 16,
    y: footerBoxY + footerBoxH - 118,
    size: 7,
    font: fontRegular,
    color: cMuted,
  });

  // ── Draw Embedded QR Code on Right ──────────────────────────
  const qrSize = 115;
  const qrX = width - 190;
  const qrY = footerBoxY + 16;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const qrCaption = "SCAN TO VERIFY LIVE";
  const qrSubCaption = "Free Public EVM Lookup";
  const capW = fontBold.widthOfTextAtSize(qrCaption, 7.5);
  const subW = fontRegular.widthOfTextAtSize(qrSubCaption, 6.5);

  page.drawText(qrCaption, {
    x: qrX + (qrSize - capW) / 2,
    y: qrY - 10,
    size: 7.5,
    font: fontBold,
    color: cNavy,
  });

  page.drawText(qrSubCaption, {
    x: qrX + (qrSize - subW) / 2,
    y: qrY - 20,
    size: 6.5,
    font: fontRegular,
    color: cMuted,
  });

  // ── Embed Uploaded Document (Exhibit A) if provided ──────────
  if (params.uploadedDocBase64) {
    try {
      const commaIdx = params.uploadedDocBase64.indexOf(",");
      const rawBase64 = commaIdx !== -1 ? params.uploadedDocBase64.slice(commaIdx + 1) : params.uploadedDocBase64;
      const docBuffer = Buffer.from(rawBase64, "base64");

      // Check if uploaded document is a PDF (%PDF- is 0x25 0x50 0x44 0x46)
      const isPdf = docBuffer.length >= 4 &&
        docBuffer[0] === 0x25 && docBuffer[1] === 0x50 && docBuffer[2] === 0x44 && docBuffer[3] === 0x46;

      if (isPdf) {
        try {
          const donorPdf = await PDFDocument.load(docBuffer, { ignoreEncryption: true });
          const donorPageIndices = donorPdf.getPageIndices();
          const copiedPages = await pdfDoc.copyPages(donorPdf, donorPageIndices);
          for (const p of copiedPages) {
            pdfDoc.addPage(p);
          }
        } catch (pdfErr) {
          console.error("Failed to append uploaded PDF pages:", pdfErr);
        }
      } else {
        // Image document (PNG or JPEG)
        try {
          let embeddedImg;
          const isPng = docBuffer.length >= 4 &&
            docBuffer[0] === 0x89 && docBuffer[1] === 0x50 && docBuffer[2] === 0x4e && docBuffer[3] === 0x47;

          if (isPng) {
            embeddedImg = await pdfDoc.embedPng(docBuffer);
          } else {
            try {
              embeddedImg = await pdfDoc.embedJpg(docBuffer);
            } catch {
              embeddedImg = await pdfDoc.embedPng(docBuffer);
            }
          }

          if (embeddedImg) {
            const imgAspect = embeddedImg.width / embeddedImg.height;
            const isLandscape = imgAspect >= 1;
            const docPage = isLandscape
              ? pdfDoc.addPage([841.89, 595.28])
              : pdfDoc.addPage([595.28, 841.89]);

            const pWidth = docPage.getWidth();
            const pHeight = docPage.getHeight();

            // Background
            docPage.drawRectangle({
              x: 0,
              y: 0,
              width: pWidth,
              height: pHeight,
              color: cPaper,
            });

            // Outer primary border
            docPage.drawRectangle({
              x: 20,
              y: 20,
              width: pWidth - 40,
              height: pHeight - 40,
              borderColor: cNavy,
              borderWidth: 2.5,
            });

            // Header Banner
            docPage.drawText("CERTCHAIN VERIFIED SOURCE DOCUMENT (EXHIBIT A)", {
              x: 36,
              y: pHeight - 42,
              size: 10,
              font: fontBold,
              color: cBlue,
            });

            docPage.drawText(`Certificate ID: ${params.certId} | Recipient: ${params.holderName} | Conferment: ${params.issuedAt}`, {
              x: 36,
              y: pHeight - 56,
              size: 8,
              font: fontRegular,
              color: cSlate,
            });

            docPage.drawLine({
              start: { x: 36, y: pHeight - 64 },
              end: { x: pWidth - 36, y: pHeight - 64 },
              thickness: 1,
              color: rgb(0.85, 0.88, 0.92),
            });

            // Calculate fit dimensions inside margins
            const maxW = pWidth - 72;
            const maxH = pHeight - 100;
            let drawW = maxW;
            let drawH = drawW / imgAspect;

            if (drawH > maxH) {
              drawH = maxH;
              drawW = drawH * imgAspect;
            }

            const imgX = (pWidth - drawW) / 2;
            const imgY = 28 + (maxH - drawH) / 2;

            docPage.drawImage(embeddedImg, {
              x: imgX,
              y: imgY,
              width: drawW,
              height: drawH,
            });
          }
        } catch (imgErr) {
          console.error("Failed to embed uploaded image into certificate PDF:", imgErr);
        }
      }
    } catch (docErr) {
      console.error("Error processing uploaded document for PDF:", docErr);
    }
  }

  // Save and return buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
