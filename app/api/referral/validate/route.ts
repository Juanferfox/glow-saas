import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant";
import { findUserByReferralCode } from "@/lib/data/users";

/**
 * GET /api/referral/validate?tenant=SLUG&code=XXXX
 *
 * Verifica si un código de referido es válido para el tenant.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tenantSlug = searchParams.get("tenant");
  const code = searchParams.get("code");

  if (!tenantSlug || !code) {
    return NextResponse.json({ valid: false, error: "Parámetros faltantes" }, { status: 400 });
  }

  const tenant = await getTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ valid: false, error: "Tenant no encontrado" }, { status: 404 });
  }

  const user = await findUserByReferralCode(tenant.id, code);

  if (!user) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    referrerName: user.full_name,
    bonusPoints: tenant.referral_bonus_pts,
  });
}
