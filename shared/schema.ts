import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const meetings = pgTable("meetings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("userId")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  participants: text("participants").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  duration: integer("duration"), // in seconds
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  transcriptionText: text("transcription_text"),
  abTestGroup: text("ab_test_group").notNull().default("default"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const actionItems = pgTable("action_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id")
    .references(() => meetings.id)
    .notNull(),
  userId: varchar("userId")
    .references(() => users.id)
    .notNull(),
  text: text("text").notNull(),
  assignee: text("assignee"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  dueDate: text("due_date"),
  completed: boolean("completed").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const abTests = pgTable("ab_tests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  model: text("model").notNull(), // default, enhanced, speed
  prompt: text("prompt").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testResults = pgTable("test_results", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  testId: varchar("test_id")
    .references(() => abTests.id)
    .notNull(),
  meetingId: varchar("meeting_id")
    .references(() => meetings.id)
    .notNull(),
  accuracyRate: integer("accuracy_rate"), // percentage
  processingTime: integer("processing_time"), // in seconds
  actionItemsFound: integer("action_items_found"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // hashed password for email/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  provider: varchar("provider").notNull().default("email"), // email, google, apple
  providerId: varchar("provider_id"), // external provider user ID
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({
  id: true,
  createdAt: true,
});

export const insertAbTestSchema = createInsertSchema(abTests).omit({
  id: true,
  createdAt: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type ActionItem = typeof actionItems.$inferSelect;
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type AbTest = typeof abTests.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
