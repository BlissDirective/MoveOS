import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./profiles";
import { moves } from "./moves";
import { approvalItems } from "./approvals";
import { affiliateCategory } from "./enums";

/**
 * affiliate_events — one row per affiliate click, the attribution spine of the
 * referral-first revenue model (ISP / utility / insurance / storage / home
 * services; mover-side fees are FMCSA-gated and intentionally absent).
 *
 * The row id doubles as the network subId (CJ `sid`, Impact `subId1`), so a
 * conversion postback or report row can be joined back to the exact user,
 * move, and approval card that produced it. `convertedAt` / `commissionUsd`
 * stay null until the network reports the conversion.
 */
export const affiliateEvents = pgTable(
  "affiliate_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    // Nullable: a click can outlive its move (move deleted) without losing
    // the revenue record.
    moveId: uuid("move_id").references(() => moves.id, {
      onDelete: "set null",
    }),
    // The approval card the click came from, when it came from one.
    approvalItemId: uuid("approval_item_id").references(
      () => approvalItems.id,
      { onDelete: "set null" },
    ),

    category: affiliateCategory("category").notNull(),
    /** Stable offer key in the offers config (e.g. "isp_xfinity"). */
    offerId: text("offer_id").notNull(),
    /** Human provider name (e.g. "Xfinity"). */
    provider: text("provider").notNull(),
    /** Affiliate network: "cj" | "impact" | "direct". Text, not enum — networks churn. */
    network: text("network").notNull(),
    /** The fully-built partner URL the user was redirected to (subId included). */
    destinationUrl: text("destination_url").notNull(),

    clickedAt: timestamp("clicked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Conversion fields — filled by network postback/report reconciliation.
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    commissionUsd: numeric("commission_usd", { precision: 10, scale: 2 }),
    /** Network-side transaction/order id for the conversion. */
    conversionRef: text("conversion_ref"),
  },
  (t) => [
    index("idx_affiliate_events_user_id").on(t.userId),
    index("idx_affiliate_events_move_id").on(t.moveId),
    index("idx_affiliate_events_offer_id").on(t.offerId),
  ],
);

export type AffiliateEvent = typeof affiliateEvents.$inferSelect;
export type NewAffiliateEvent = typeof affiliateEvents.$inferInsert;
