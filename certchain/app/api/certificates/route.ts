import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  issueCertificateOnChain,
  computeCertHash,
} from "@/lib/blockchain";
import { sendCertificateEmail } from "@/lib/email";
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

    let query = supabase
      .from("certificates")
      .select("*", { count: "exact" })
      .order("issued_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ certificates: data, total: count, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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
      pdfBase64,   // base64 encoded PDF
      fraudScore,  // from AI service (passed from frontend)
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

    // Compute SHA-256 hash of certificate content
    const certHash = computeCertHash(certMetadata);

    // Upload PDF to Supabase Storage
    let storagePath = "";
    let publicUrl   = "";
    if (pdfBase64) {
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const fileName  = `${certId}.pdf`;
      const { error: uploadError } = await adminDb.storage
        .from("certificates")
        .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: false });

      if (uploadError) throw uploadError;

      storagePath = fileName;
      const { data: urlData } = adminDb.storage
        .from("certificates")
        .getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
    }

    // Issue certificate on Ethereum blockchain
    const expiresAtTimestamp = expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : 0;
    const { txHash, blockNumber } = await issueCertificateOnChain({
      certId,
      holderName,
      certType,
      certHash,
      ipfsCID:    storagePath || "",
      expiresAt:  expiresAtTimestamp,
    });

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
        metadata:     { degree, grade, year },
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Also insert audit log
    await adminDb.from("audit_logs").insert({
      cert_id:  certId,
      action:   "ISSUED",
      reason:   "Initial issuance",
      actor_id: user.id,
      tx_hash:  txHash,
    });

    // Send email to holder
    if (holderEmail) {
      await sendCertificateEmail({
        to:          holderEmail,
        holderName,
        certId,
        certType,
        institution,
        issuedAt:    new Date().toLocaleDateString("en-IN"),
        pdfUrl:      publicUrl,
        txHash,
      }).catch(console.error); // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success:     true,
      certId,
      txHash,
      blockNumber,
      pdfUrl:      publicUrl,
      certificate: certRecord,
    });

  } catch (err: any) {
    console.error("Issue certificate error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
