import {
  type Meeting,
  type InsertMeeting,
  type ActionItem,
  type InsertActionItem,
  type AbTest,
  type InsertAbTest,
  type TestResult,
  type InsertTestResult,
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  meetings,
  actionItems,
  abTests,
  testResults,
  users,
  sessions,
  InsertSubscription,
  Subscription,
  subscriptions,
  InsertAsset,
  Asset,
  assets,
} from "@shared/schema";
import { db } from "./core/db";
import { desc, eq, or, sql } from "drizzle-orm";

export interface IStorage {
  // Meetings
  getMeeting(id: string): Promise<Meeting | undefined>;
  getMeetings(limit?: number, userId?: string): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(
    id: string,
    updates: Partial<Meeting>,
  ): Promise<Meeting | undefined>;
  searchMeetings(query: string): Promise<Meeting[]>;

  // Action Items
  getActionItem(id: string): Promise<ActionItem | undefined>;
  getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]>;
  getAllActionItems(limit?: number, userId?: string): Promise<ActionItem[]>;
  createActionItem(actionItem: InsertActionItem): Promise<ActionItem>;
  updateActionItem(
    id: string,
    updates: Partial<ActionItem>,
  ): Promise<ActionItem | undefined>;

  // A/B Tests
  getAbTest(id: string): Promise<AbTest | undefined>;
  getAbTests(): Promise<AbTest[]>;
  createAbTest(abTest: InsertAbTest): Promise<AbTest>;

  // Test Results
  getTestResults(testId: string): Promise<TestResult[]>;
  createTestResult(testResult: InsertTestResult): Promise<TestResult>;
  getTestResultsByMeeting(meetingId: string): Promise<TestResult[]>;

  // Users
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Sessions
  getSession(token: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  deleteSession(token: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Subscriptions
  createSubscription(sub: InsertSubscription): Promise<Subscription>;

  // Assets
  getAssetById(id: string): Promise<Asset | undefined>;
  getAssetByUser(userId: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | undefined>;
  updateAssetFieldBy(
    userId: string,
    field: keyof Asset,
    amount: number,
  ): Promise<Asset | undefined>;
}

export class DrizzleStorage implements IStorage {
  // Mettings
  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id));
    return meeting;
  }
  async getMeetings(limit = 50, userId?: string): Promise<Meeting[]> {
    const fromDb = db.select().from(meetings);

    if (userId) {
      fromDb.where(eq(meetings.userId, userId));
    }

    return fromDb.orderBy(desc(meetings.createdAt)).limit(limit);
  }
  async createMeeting(data: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db
      .insert(meetings)
      .values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        duration: data.duration ?? null,
        transcriptionText: data.transcriptionText ?? null,
        status: data.status ?? "pending",
        abTestGroup: data.abTestGroup ?? "default",
      })
      .returning();
    return meeting;
  }
  async updateMeeting(
    id: string,
    updates: Partial<Meeting>,
  ): Promise<Meeting | undefined> {
    const [updated] = await db
      .update(meetings)
      .set(updates)
      .where(eq(meetings.id, id))
      .returning();
    return updated;
  }
  async searchMeetings(query: string): Promise<Meeting[]> {
    const q = `%${query.toLowerCase()}%`;
    return db
      .select()
      .from(meetings)
      .where(
        or(
          sql`lower(${meetings.title}) like ${q}`,
          sql`lower(${meetings.participants}) like ${q}`,
          sql`lower(coalesce(${meetings.transcriptionText}, '')) like ${q}`,
        ),
      );
  }

  // Action Items
  async getActionItem(id: string): Promise<ActionItem | undefined> {
    const [item] = await db
      .select()
      .from(actionItems)
      .where(eq(actionItems.id, id));
    return item;
  }
  async getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]> {
    return db
      .select()
      .from(actionItems)
      .where(eq(actionItems.meetingId, meetingId))
      .orderBy(desc(actionItems.priority));
  }
  async getAllActionItems(limit = 50, userId?: string): Promise<ActionItem[]> {
    const fromDb = db.select().from(actionItems);

    if (userId) {
      fromDb.where(eq(actionItems.userId, userId));
    }

    return fromDb
      .orderBy(
        sql`
        completed ASC,
        CASE priority
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          ELSE 1
        END DESC
      `,
      )
      .limit(limit);
  }
  async createActionItem(data: InsertActionItem): Promise<ActionItem> {
    const [item] = await db
      .insert(actionItems)
      .values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        completed: data.completed ?? false,
        assignee: data.assignee ?? null,
        dueDate: data.dueDate ?? null,
        priority: data.priority ?? "medium",
        description: data.description ?? null,
      })
      .returning();
    return item;
  }
  async updateActionItem(
    id: string,
    updates: Partial<ActionItem>,
  ): Promise<ActionItem | undefined> {
    const [updated] = await db
      .update(actionItems)
      .set(updates)
      .where(eq(actionItems.id, id))
      .returning();
    return updated;
  }

  // A/B Tests
  async getAbTest(id: string): Promise<AbTest | undefined> {
    const [test] = await db.select().from(abTests).where(eq(abTests.id, id));
    return test;
  }
  async getAbTests(): Promise<AbTest[]> {
    return db.select().from(abTests);
  }
  async createAbTest(data: InsertAbTest): Promise<AbTest> {
    const [test] = await db
      .insert(abTests)
      .values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      })
      .returning();
    return test;
  }

  // Test Results
  async getTestResults(testId: string): Promise<TestResult[]> {
    return db.select().from(testResults).where(eq(testResults.testId, testId));
  }
  async createTestResult(data: InsertTestResult): Promise<TestResult> {
    const [result] = await db
      .insert(testResults)
      .values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        accuracyRate: data.accuracyRate ?? null,
        processingTime: data.processingTime ?? null,
        actionItemsFound: data.actionItemsFound ?? null,
      })
      .returning();
    return result;
  }
  async getTestResultsByMeeting(meetingId: string): Promise<TestResult[]> {
    return db
      .select()
      .from(testResults)
      .where(eq(testResults.meetingId, meetingId));
  }

  // Users
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(data: InsertUser): Promise<User> {
    const now = new Date();
    const [user] = await db
      .insert(users)
      .values({
        ...data,
        id: crypto.randomUUID(),
        password: data.password ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        profileImageUrl: data.profileImageUrl ?? null,
        provider: data.provider ?? "email",
        providerId: data.providerId ?? null,
        isEmailVerified: data.isEmailVerified ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return user;
  }
  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Sessions
  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    if (!session) return undefined;
    if (session.expiresAt < new Date()) {
      await db.delete(sessions).where(eq(sessions.token, token));
      return undefined;
    }
    return session;
  }
  async createSession(data: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return session;
  }
  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(sql`${sessions.expiresAt} < now()`);
  }

  // Subscriptions
  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        ...sub,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return subscription;
  }

  // Assets
  async getAssetById(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }
  async getAssetByUser(userId: string): Promise<Asset | undefined> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.userId, userId));
    return asset;
  }
  async createAsset(data: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return asset;
  }
  async updateAsset(
    id: string,
    updates: Partial<Asset>,
  ): Promise<Asset | undefined> {
    const [updated] = await db
      .update(assets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updated;
  }
  async updateAssetFieldBy(
    userId: string,
    field: keyof Asset,
    amount: number,
  ): Promise<Asset | undefined> {
    const [updated] = await db
      .update(assets)
      .set({
        transcriptionCount: sql`${assets[field]} + ${amount}`,
      })
      .where(eq(assets.userId, userId))
      .returning();
    return updated;
  }
}

export const storage = new DrizzleStorage();
