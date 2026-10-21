import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  issueCertificateOnChain,
  computeCertHash,
} from "@/lib/blockchain";
import { sendCertificateEmail } from "@/lib/email";
import { generateCertificatePdf } from "@/lib/pdf";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/server";

// ── GET /api/certificates — list all certificates (issuer/admin only) ─────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page   = parseInt(searchParams.get("page") ?? "1");
    const limit  = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    const adminDb = createAdminClient();
    let query = adminDb
      .from("certificates")
      .select("*", { count: "exact" })
      .order("issued_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ certificates: data ?? [], total: count ?? 0, page, limit });
  } catch (err: any) {
    const errorMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// ── POST /api/certificates — issue a new certificate ─────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminDb  = createAdminClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      holderName, holderEmail, certType, institution,
      degree, grade, year, expiresAt,
      pdfBase64,          // base64 encoded PDF
      uploadedDocBase64,  // uploaded document (scan or PDF)
      fraudScore,         // from AI service (passed from frontend)
    } = body;

    // Basic validation
    if (!holderName || !holderEmail || !certType || !institution) {
      return NextResponse.json(
        { error: "Missing required fields: holderName, holderEmail, certType, institution" },
        { status: 400 }
      );
    }

    // Block high fraud score
    if (fraudScore && fraudScore > 70) {
      return NextResponse.json(
        { error: "Certificate blocked by AI fraud detection", fraudScore },
        { status: 422 }
      );
    }

    // Generate unique certificate ID
    const certId = `CERT-${new Date().getFullYear()}-${uuidv4().split("-")[0].toUpperCase()}`;

    // Build certificate metadata object
    const certMetadata = {
      holderName, certType, institution, degree, grade, year,
      certId, issuedAt: new Date().toISOString(),
    };

    // Compute Keccak-256 hash of certificate content
    const certHash = computeCertHash(certMetadata);

    // Issue certificate on Ethereum blockchain
    const expiresAtTimestamp = expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : 0;
    const { txHash, blockNumber } = await issueCertificateOnChain({
      certId,
      holderName,
      certType,
      certHash,
      ipfsCID:    certId,
      expiresAt:  expiresAtTimestamp,
    });

    // Dynamically resolve public application URL (supports Vercel, production, and Wi-Fi phone testing)
    const reqHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const reqProto = req.headers.get("x-forwarded-proto") || (reqHost.includes("localhost") ? "http" : "https");
    const detectedOrigin = reqHost ? `${reqProto}://${reqHost}` : "";

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL
      : (detectedOrigin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    const resolvedAppUrl = configuredUrl.includes("localhost")
      ? "http://10.22.39.175:3000"
      : configuredUrl;

    // Automatically generate official PDF with embedded QR Code & uploaded document
    let pdfBuffer: Buffer;
    if (pdfBase64) {
      pdfBuffer = Buffer.from(pdfBase64, "base64");
    } else {
      pdfBuffer = await generateCertificatePdf({
        certId,
        holderName,
        certType,
        institution,
        degree,
        grade,
        year,
        issuedAt: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
        certHash,
        txHash,
        uploadedDocBase64,
        appUrl: resolvedAppUrl,
      });
    }

    // Upload generated PDF to Supabase Storage bucket "certificates"
    let storagePath = `${certId}.pdf`;
    let publicUrl   = "";
    try {
      const { error: uploadError } = await adminDb.storage
        .from("certificates")
        .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

      if (!uploadError) {
        const { data: urlData } = adminDb.storage
          .from("certificates")
          .getPublicUrl(storagePath);
        publicUrl = urlData.publicUrl;
      }
    } catch (e: any) {
      console.warn("Supabase Storage upload warning:", e?.message || e);
    }

    // Save metadata to Supabase DB
    const { data: certRecord, error: dbError } = await adminDb
      .from("certificates")
      .insert({
        cert_id:      certId,
        holder_name:  holderName,
        holder_email: holderEmail,
        cert_type:    certType,
        institution,
        issued_by:    user.id,
        tx_hash:      txHash,
        block_number: blockNumber,
        storage_path: storagePath,
        cert_hash:    certHash,
        fraud_score:  fraudScore ?? 0,
        status:       "ACTIVE",
        expires_at:   expiresAt || null,
        metadata:     { degree, grade, year, pdfUrl: publicUrl },
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Insert audit log
    await adminDb.from("audit_logs").insert({
      cert_id:  certId,
      action:   "ISSUED",
      reason:   "Initial issuance",
      actor_id: user.id,
      tx_hash:  txHash,
    });

    // Send email to holder via Gmail SMTP with PDF attachment
    let emailResult: any = null;
    if (holderEmail) {
      try {
        emailResult = await sendCertificateEmail({
          to:          holderEmail,
          holderName,
          certId,
          certType,
          institution,
          issuedAt:    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
          pdfUrl:      publicUrl,
          pdfBuffer,
          txHash,
          appUrl:      resolvedAppUrl,
        });
        console.log("Certificate email delivery result:", emailResult);
      } catch (emailErr) {
        console.error("Certificate email delivery exception:", emailErr);
      }
    }

    return NextResponse.json({
      success:     true,
      certId,
      txHash,
      blockNumber,
      pdfUrl:      publicUrl,
      emailSent:   emailResult?.success ?? false,
      emailProvider: emailResult?.provider ?? null,
      certificate: certRecord,
    });

  } catch (err: any) {
    console.error("Issue certificate error:", err);
    const errorMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
