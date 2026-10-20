import { NextRequest, NextResponse } from "next/server";
import { getCertificateFromChain } from "@/lib/blockchain";
import { createAdminClient } from "@/lib/supabase/server";

// ── GET /api/verify?certId=CERT-2025-XXXX ────────────────────────────────
// PUBLIC endpoint — no authentication required
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const certId = searchParams.get("certId");

    if (!certId) {
      return NextResponse.json({ error: "certId query parameter is required" }, { status: 400 });
    }

    // 1. Query blockchain — the ultimate source of truth
    const onChain = await getCertificateFromChain(certId);

    if (!onChain) {
      return NextResponse.json({
        valid:  false,
        status: "NOT_FOUND",
        reason: "Certificate not found on blockchain",
        certId,
      });
    }

    // 2. Check if expired (on-chain logic)
    const now = Math.floor(Date.now() / 1000);
    if (onChain.expiresAt > 0 && now > onChain.expiresAt) {
      return NextResponse.json({
        valid:     false,
        status:    "EXPIRED",
        expiredAt: new Date(onChain.expiresAt * 1000).toISOString(),
        certId,
      });
    }

    // 3. Get metadata from Supabase for display (institution, degree etc.)
    const adminDb = createAdminClient();
    const { data: meta } = await adminDb
      .from("certificates")
      .select("institution, metadata, holder_name, cert_type, issued_at, tx_hash, fraud_score, storage_path")
      .eq("cert_id", certId)
      .single();

    const isValid  = onChain.status === "ACTIVE";
    const issuedAt = new Date(onChain.issuedAt * 1000).toISOString();

    let pdfUrl = meta?.metadata?.pdfUrl || "";
    if (!pdfUrl && meta?.storage_path) {
      const { data: urlData } = adminDb.storage.from("certificates").getPublicUrl(meta.storage_path);
      pdfUrl = urlData.publicUrl;
    }

    return NextResponse.json({
      valid:        isValid,
      status:       onChain.status,
      certId:       onChain.certId,
      holderName:   onChain.holderName,
      certType:     onChain.certType,
      institution:  meta?.institution   ?? "",
      degree:       meta?.metadata?.degree ?? "",
      issuedAt,
      txHash:       meta?.tx_hash        ?? "",
      pdfUrl,
      certHash:     onChain.certHash,
      issuerAddress: onChain.issuerAddress,
      etherscanUrl: `https://sepolia.etherscan.io/tx/${meta?.tx_hash}`,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
