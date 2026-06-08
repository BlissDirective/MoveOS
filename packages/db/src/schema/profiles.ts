import {
  pgTable,
  uuid,
  text,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * user_profiles — one row per authenticated user.
 *
 * `id` is the Supabase `auth.users(id)`. Drizzle can't model the cross-schema
 * FK to `auth.users`, so that constraint (and RLS) is added in a hand-written
 * migration (see supabase/0001_auth_fk_rls.sql); here `id` is a plain uuid PK.
 */
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  phone: text("phone"),

  // Nylas grant (send email on the user's behalf).
  nylasGrantId: text("nylas_grant_id"),
  nylasEmail: text("nylas_email"),

  // Stripe customer (one-time unlock + gifting).
  stripeCustomerId: text("stripe_customer_id"),

  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),

  notificationPrefs: jsonb("notification_prefs")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  // Web Push subscription (PushSubscription JSON). Mobile push is V2.
  webPushSubscription: jsonb("web_push_subscription").$type<
    Record<string, unknown>
  >(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
