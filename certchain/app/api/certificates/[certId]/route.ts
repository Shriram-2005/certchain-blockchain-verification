import { NextRequest, NextResponse } from "next/server";
import { getCertificateFromChain, getCertificateHistoryFromChain } from "@/lib/blockchain";
import { createAdminClient } from "@/lib/supabase/server";

// ── GET /api/certificates/[certId] — get certificate details ─────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    const { certId } = await params;

    // 1. Query blockchain (source of truth for status + hash)
    const onChain = await getCertificateFromChain(certId);
    if (!onChain) {
      return NextResponse.json({ error: "Certificate not found on blockchain" }, { status: 404 });
    }

    // 2. Get metadata from Supabase DB (for holder name, email, institution etc.)
    const adminDb = createAdminClient();
    const { data: dbRecord } = await adminDb
      .from("certificates")
      .select("*")
      .eq("cert_id", certId)
      .single();

    // 3. Get on-chain audit history
    const history = await getCertificateHistoryFromChain(certId);

    return NextResponse.json({
      ...onChain,
      ...dbRecord,
      auditHistory: history,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
