import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moodLogsTable = pgTable("mood_logs", {
  id: serial("id").primaryKey(),
  mood: text("mood").notNull(), // happy | calm | stressed | anxious | bored | sad | excited | angry
  note: text("note"),
  spendingAmountToday: numeric("spending_amount_today", { precision: 10, scale: 2 }),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMoodLogSchema = createInsertSchema(moodLogsTable).omit({ id: true, loggedAt: true });
export type InsertMoodLog = z.infer<typeof insertMoodLogSchema>;
export type MoodLog = typeof moodLogsTable.$inferSelect;
