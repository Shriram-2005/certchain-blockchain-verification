import { NextRequest, NextResponse } from "next/server";

// ── POST /api/ai/validate ─────────────────────────────────────────────────
// Proxy to HuggingFace Spaces AI service
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const aiServiceUrl = process.env.AI_SERVICE_URL;

    if (!aiServiceUrl) {
      // If AI service not configured, return safe default (allow issuance)
      console.warn("AI_SERVICE_URL not set — skipping AI validation");
      return NextResponse.json({
        fraudScore:     0,
        flags:          [],
        recommendation: "APPROVE",
        details:        { note: "AI service not configured" },
      });
    }

    const response = await fetch(`${aiServiceUrl}/validate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (err: any) {
    console.error("AI validation proxy error:", err.message);
    // On failure, return safe default — don't block issuance due to AI downtime
    return NextResponse.json({
      fraudScore:     5,
      flags:          ["ai_service_timeout"],
      recommendation: "APPROVE",
      details:        { error: "AI service temporarily unavailable" },
    });
  }
}
