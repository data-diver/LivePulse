import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
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

export const eventSettings = pgTable("event_settings", {
  id: varchar("id").primaryKey().default("default"),
  title: text("title").default("Learn & Build with AI"),
  subtitle: text("subtitle").default("Live Q&A Session"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  content: true,
  author: true,
}).extend({
  content: z.string().min(10, "Question must be at least 10 characters long").max(500, "Question must be less than 500 characters"),
  author: z.string().optional(),
});

export const insertEventSettingsSchema = createInsertSchema(eventSettings).pick({
  title: true,
  subtitle: true,
}).extend({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  subtitle: z.string().max(200, "Subtitle must be less than 200 characters").optional(),
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertEventSettings = z.infer<typeof insertEventSettingsSchema>;
export type EventSettings = typeof eventSettings.$inferSelect;
