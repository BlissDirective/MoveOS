import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  date,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./profiles";
import { moveStatus, homeSize, moveType, planTier } from "./enums";

/**
 * moves — the central planning object. Every task, agent run, and approval
 * hangs off a move. `userId` is the ownership anchor used by scopedDb().
 */
export const moves = pgTable(
  "moves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),

    status: moveStatus("status").default("planning").notNull(),

    // Origin.
    originAddress: text("origin_address"),
    originCity: text("origin_city"),
    originState: text("origin_state"),
    originZip: text("origin_zip"),
    originLat: numeric("origin_lat", { precision: 10, scale: 7 }),
    originLng: numeric("origin_lng", { precision: 10, scale: 7 }),

    // Destination.
    destinationAddress: text("destination_address"),
    destinationCity: text("destination_city"),
    destinationState: text("destination_state"),
    destinationZip: text("destination_zip"),
    destinationLat: numeric("destination_lat", { precision: 10, scale: 7 }),
    destinationLng: numeric("destination_lng", { precision: 10, scale: 7 }),

    moveDate: date("move_date").notNull(),
    homeSize: homeSize("home_size").notNull(),
    moveType: moveType("move_type"),

    specialItems: text("special_items").array().default([]).notNull(),
    // Free-form intake answers used to seed the timeline agent.
    usageProfile: jsonb("usage_profile")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    moveProfileData: jsonb("move_profile_data")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    // Denormalized progress counters (kept in sync on task writes).
    taskCount: integer("task_count").default(0).notNull(),
    tasksCompleted: integer("tasks_completed").default(0).notNull(),
    complexityScore: integer("complexity_score"),

    // Monetization.
    planTier: planTier("plan_tier").default("free").notNull(),
    stripePaymentIntent: text("stripe_payment_intent"),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_moves_user_id").on(t.userId),
    index("idx_moves_move_date").on(t.moveDate),
    index("idx_moves_status").on(t.status),
  ],
);

export type Move = typeof moves.$inferSelect;
export type NewMove = typeof moves.$inferInsert;
