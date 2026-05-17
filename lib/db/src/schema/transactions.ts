import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: text("type").notNull(), // "income" | "expense"
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  regretScore: integer("regret_score"), // 1-5, nullable
  moodAtPurchase: text("mood_at_purchase"), // nullable
  notes: text("notes"), // nullable
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
