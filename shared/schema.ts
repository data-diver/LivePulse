import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  author: text("author").default("Anonymous"),
  status: text("status").$type<"pending" | "approved" | "rejected">().default("pending"),
  likes: integer("likes").default(0),
  likedBy: text("liked_by").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  content: true,
  author: true,
}).extend({
  content: z.string().min(10, "Question must be at least 10 characters long").max(500, "Question must be less than 500 characters"),
  author: z.string().optional(),
});

// Event settings schema
export const eventSettings = pgTable("event_settings", {
  id: serial("id").primaryKey(),
  eventName: varchar("event_name", { length: 255 }).notNull().default("Learn & Build with AI"),
  autoApproveQuestions: boolean("auto_approve_questions").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertEventSettingsSchema = createInsertSchema(eventSettings).omit({
  id: true,
  updatedAt: true
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type EventSettings = typeof eventSettings.$inferSelect;
export type InsertEventSettings = z.infer<typeof insertEventSettingsSchema>;
