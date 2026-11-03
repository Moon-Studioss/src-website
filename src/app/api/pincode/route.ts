import { NextRequest, NextResponse } from "next/server";

// Checks an Indian PIN code against India Post's public lookup (done server-side: no CORS, one place to change).
// Returns { valid: true, place } | { valid: false } | { valid: null } when the lookup service is down.
export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get("pin") ?? "";
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({ valid: false });
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } });
    const [r] = await res.json();
    if (r?.Status === "Success" && r.PostOffice?.length) {
      const o = r.PostOffice[0];
      return NextResponse.json({ valid: true, place: `${o.District}, ${o.State}` });
    }
    if (r?.Status === "Error" || r?.Status === "404") return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: null });
  } catch {
    return NextResponse.json({ valid: null });
  }
}
