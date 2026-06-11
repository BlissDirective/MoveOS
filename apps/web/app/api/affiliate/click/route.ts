import { NextResponse, type NextRequest } from "next/server";
import { getDb, scopedDb, NotOwnedError } from "@moveros/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AFFILIATE_OFFERS, buildAffiliateUrl } from "@/lib/affiliate/offers";

/**
 * /api/affiliate/click?offer=<offerId>[&moveId=<uuid>][&approval=<uuid>]
 *
 * The attribution gate every affiliate link routes through: authenticate the
 * user, record an affiliate_events row (ownership-checked via scopedDb), then
 * 302 to the partner URL with the event id as the network subId. Conversion
 * postbacks/reports join back on that id.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  const offerId = req.nextUrl.searchParams.get("offer") ?? "";
  const offer = AFFILIATE_OFFERS[offerId];
  if (!offer) {
    return NextResponse.redirect(new URL("/dashboard?affiliate=unknown", req.url));
  }

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const moveId = req.nextUrl.searchParams.get("moveId");
  const approvalItemId = req.nextUrl.searchParams.get("approval");

  try {
    const scoped = scopedDb(getDb(), user.id);
    // Mint the event id up front so the stored destinationUrl is exactly the
    // URL the user is sent to, subId included.
    const eventId = crypto.randomUUID();
    const url = buildAffiliateUrl(offer, eventId);
    await scoped.affiliate.recordClick({
      id: eventId,
      moveId: moveId && uuidRe.test(moveId) ? moveId : null,
      approvalItemId:
        approvalItemId && uuidRe.test(approvalItemId) ? approvalItemId : null,
      category: offer.category,
      offerId: offer.id,
      provider: offer.provider,
      network: offer.network,
      destinationUrl: url,
    });
    return NextResponse.redirect(url, { status: 302 });
  } catch (err) {
    if (err instanceof NotOwnedError) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    throw err;
  }
}
