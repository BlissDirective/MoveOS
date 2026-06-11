/**
 * The affiliate offers catalog — the single source of truth for what MoverOS
 * can refer users to and where the money comes from (review §7.3:
 * referral-first monetization; mover-side fees are FMCSA-gated and absent).
 *
 * Static config on purpose: ~a dozen offers don't need a table or a CMS. The
 * `linkTemplate` URLs are provider landing pages until the affiliate-network
 * applications (CJ Affiliate / Impact) are approved — swap in the real
 * tracking links then. `{subId}` is replaced with the affiliate_events row id
 * so network conversion reports join back to the exact click.
 */

export type AffiliateCategory =
  | "isp"
  | "utility"
  | "insurance"
  | "storage"
  | "home_service";

export interface AffiliateOffer {
  /** Stable key, also stored on affiliate_events.offer_id. */
  id: string;
  category: AffiliateCategory;
  provider: string;
  network: "cj" | "impact" | "direct";
  /** Partner URL; `{subId}` is replaced with the click-event id. */
  linkTemplate: string;
  /** Rough commission for internal modeling — never shown to users. */
  payoutEstimateUsd: number;
  /** ISP-only metadata the InternetAgent uses to rank candidates. */
  isp?: {
    technology: "cable" | "fiber" | "5g_home" | "dsl" | "satellite";
    typicalDownloadMbps: number;
    typicalMonthlyUsd: number;
    notes: string;
  };
}

export const AFFILIATE_OFFERS: Record<string, AffiliateOffer> = {
  isp_xfinity: {
    id: "isp_xfinity",
    category: "isp",
    provider: "Xfinity",
    network: "cj",
    linkTemplate: "https://www.xfinity.com/learn/internet-service?sid={subId}",
    payoutEstimateUsd: 100,
    isp: {
      technology: "cable",
      typicalDownloadMbps: 500,
      typicalMonthlyUsd: 55,
      notes: "Widest cable footprint; promo pricing first 12 months.",
    },
  },
  isp_att_fiber: {
    id: "isp_att_fiber",
    category: "isp",
    provider: "AT&T Fiber",
    network: "cj",
    linkTemplate: "https://www.att.com/internet/fiber/?subId={subId}",
    payoutEstimateUsd: 100,
    isp: {
      technology: "fiber",
      typicalDownloadMbps: 1000,
      typicalMonthlyUsd: 65,
      notes: "Symmetric fiber where available; no annual contract.",
    },
  },
  isp_verizon_fios: {
    id: "isp_verizon_fios",
    category: "isp",
    provider: "Verizon Fios",
    network: "impact",
    linkTemplate: "https://www.verizon.com/home/fios/?subId1={subId}",
    payoutEstimateUsd: 75,
    isp: {
      technology: "fiber",
      typicalDownloadMbps: 940,
      typicalMonthlyUsd: 65,
      notes: "Northeast/mid-Atlantic footprint; strong reliability ratings.",
    },
  },
  isp_tmobile_home: {
    id: "isp_tmobile_home",
    category: "isp",
    provider: "T-Mobile Home Internet",
    network: "impact",
    linkTemplate: "https://www.t-mobile.com/home-internet?subId1={subId}",
    payoutEstimateUsd: 50,
    isp: {
      technology: "5g_home",
      typicalDownloadMbps: 200,
      typicalMonthlyUsd: 50,
      notes: "No install appointment — self-setup; good renter option.",
    },
  },
  isp_spectrum: {
    id: "isp_spectrum",
    category: "isp",
    provider: "Spectrum",
    network: "cj",
    linkTemplate: "https://www.spectrum.com/internet?sid={subId}",
    payoutEstimateUsd: 75,
    isp: {
      technology: "cable",
      typicalDownloadMbps: 500,
      typicalMonthlyUsd: 50,
      notes: "Large footprint; no data caps; modem included.",
    },
  },
  insurance_lemonade: {
    id: "insurance_lemonade",
    category: "insurance",
    provider: "Lemonade",
    network: "direct",
    linkTemplate: "https://www.lemonade.com/renters?ref={subId}",
    payoutEstimateUsd: 30,
  },
  storage_extra_space: {
    id: "storage_extra_space",
    category: "storage",
    provider: "Extra Space Storage",
    network: "cj",
    linkTemplate: "https://www.extraspace.com/?sid={subId}",
    payoutEstimateUsd: 30,
  },
};

/** All offers in a category (e.g. the ISP candidates for the InternetAgent). */
export function offersByCategory(category: AffiliateCategory): AffiliateOffer[] {
  return Object.values(AFFILIATE_OFFERS).filter((o) => o.category === category);
}

/** Build the outbound partner URL for a recorded click event. */
export function buildAffiliateUrl(offer: AffiliateOffer, eventId: string): string {
  return offer.linkTemplate.replaceAll("{subId}", encodeURIComponent(eventId));
}
