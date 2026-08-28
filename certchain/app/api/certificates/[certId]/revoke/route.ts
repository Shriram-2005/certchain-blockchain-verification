import { NextRequest, NextResponse } from "next/server";
import { revokeCertificateOnChain } from "@/lib/blockchain";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ── PATCH /api/certificates/[certId]/revoke ───────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    const { certId } = await params;
    const supabase   = await createClient();
    const adminDb    = createAdminClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reason } = await req.json();
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: "Revocation reason is required" }, { status: 400 });
    }

    // Revoke on blockchain
    const { txHash } = await revokeCertificateOnChain(certId, reason);

    // Update Supabase DB
    await adminDb
      .from("certificates")
      .update({ status: "REVOKED", revoked_at: new Date().toISOString(), revocation_reason: reason })
      .eq("cert_id", certId);

    // Audit log
    await adminDb.from("audit_logs").insert({
      cert_id:  certId,
      action:   "REVOKED",
      reason,
      actor_id: user.id,
      tx_hash:  txHash,
    });

    return NextResponse.json({ success: true, certId, txHash });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
