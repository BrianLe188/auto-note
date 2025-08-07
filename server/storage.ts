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
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./core/db";
import { desc, eq, or, sql } from "drizzle-orm";

export interface IStorage {
  // Meetings
  getMeeting(id: string): Promise<Meeting | undefined>;
  getMeetings(limit?: number): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(
    id: string,
    updates: Partial<Meeting>,
  ): Promise<Meeting | undefined>;
  searchMeetings(query: string): Promise<Meeting[]>;

  // Action Items
  getActionItem(id: string): Promise<ActionItem | undefined>;
  getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]>;
  getAllActionItems(limit?: number): Promise<ActionItem[]>;
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
}

export class MemStorage implements IStorage {
  private meetings: Map<string, Meeting>;
  private actionItems: Map<string, ActionItem>;
  private abTests: Map<string, AbTest>;
  private testResults: Map<string, TestResult>;
  private users: Map<string, User>;
  private sessions: Map<string, Session>;

  constructor() {
    this.meetings = new Map();
    this.actionItems = new Map();
    this.abTests = new Map();
    this.testResults = new Map();
    this.users = new Map();
    this.sessions = new Map();

    // Initialize with default A/B tests
    this.initializeDefaultTests();
  }

  private initializeDefaultTests() {
    const defaultTests = [
      {
        name: "Default Model",
        description: "Standard transcription model",
        model: "default",
        prompt:
          "Extract action items from this meeting transcript. Focus on tasks, assignments, and deadlines.",
        isActive: true,
      },
      {
        name: "Enhanced Accuracy Model",
        description: "High accuracy model with better action item detection",
        model: "enhanced",
        prompt:
          "Carefully analyze this meeting transcript and extract all action items, including implicit tasks, assignments with specific people, deadlines, and follow-up items. Format as JSON with text, assignee, priority, and dueDate fields.",
        isActive: true,
      },
      {
        name: "Speed Optimized Model",
        description: "Faster processing with good accuracy",
        model: "speed",
        prompt:
          "Quickly identify key action items and tasks from this transcript.",
        isActive: true,
      },
    ];

    defaultTests.forEach((test) => {
      const id = randomUUID();
      const createdAt = new Date();
      this.abTests.set(id, { ...test, id, createdAt });
    });
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getMeetings(limit = 50): Promise<Meeting[]> {
    const meetings = Array.from(this.meetings.values())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
    return meetings;
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = randomUUID();
    const createdAt = new Date();
    const meeting: Meeting = {
      ...insertMeeting,
      id,
      createdAt,
      duration: insertMeeting.duration ?? null,
      transcriptionText: insertMeeting.transcriptionText ?? null,
      status: insertMeeting.status ?? "pending",
      abTestGroup: insertMeeting.abTestGroup ?? "default",
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(
    id: string,
    updates: Partial<Meeting>,
  ): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;

    const updatedMeeting = { ...meeting, ...updates };
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }

  async searchMeetings(query: string): Promise<Meeting[]> {
    const meetings = Array.from(this.meetings.values());
    return meetings.filter(
      (meeting) =>
        meeting.title.toLowerCase().includes(query.toLowerCase()) ||
        meeting.participants.toLowerCase().includes(query.toLowerCase()) ||
        (meeting.transcriptionText &&
          meeting.transcriptionText
            .toLowerCase()
            .includes(query.toLowerCase())),
    );
  }

  async getActionItem(id: string): Promise<ActionItem | undefined> {
    return this.actionItems.get(id);
  }

  async getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values())
      .filter((item) => item.meetingId === meetingId)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (
          priorityOrder[b.priority as keyof typeof priorityOrder] -
          priorityOrder[a.priority as keyof typeof priorityOrder]
        );
      });
  }

  async getAllActionItems(limit = 50): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values())
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (
          priorityOrder[b.priority as keyof typeof priorityOrder] -
          priorityOrder[a.priority as keyof typeof priorityOrder]
        );
      })
      .slice(0, limit);
  }

  async createActionItem(
    insertActionItem: InsertActionItem,
  ): Promise<ActionItem> {
    const id = randomUUID();
    const createdAt = new Date();
    const actionItem: ActionItem = {
      ...insertActionItem,
      id,
      createdAt,
      completed: insertActionItem.completed ?? false,
      assignee: insertActionItem.assignee ?? null,
      dueDate: insertActionItem.dueDate ?? null,
      priority: insertActionItem.priority ?? "medium",
      description: insertActionItem.description ?? null,
    };
    this.actionItems.set(id, actionItem);
    return actionItem;
  }

  async updateActionItem(
    id: string,
    updates: Partial<ActionItem>,
  ): Promise<ActionItem | undefined> {
    const actionItem = this.actionItems.get(id);
    if (!actionItem) return undefined;

    const updatedActionItem = { ...actionItem, ...updates };
    this.actionItems.set(id, updatedActionItem);
    return updatedActionItem;
  }

  async getAbTest(id: string): Promise<AbTest | undefined> {
    return this.abTests.get(id);
  }

  async getAbTests(): Promise<AbTest[]> {
    return Array.from(this.abTests.values());
  }

  async createAbTest(insertAbTest: InsertAbTest): Promise<AbTest> {
    const id = randomUUID();
    const createdAt = new Date();
    const abTest: AbTest = {
      ...insertAbTest,
      id,
      createdAt,
      description: insertAbTest.description ?? null,
      isActive: insertAbTest.isActive ?? true,
    };
    this.abTests.set(id, abTest);
    return abTest;
  }

  async getTestResults(testId: string): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(
      (result) => result.testId === testId,
    );
  }

  async createTestResult(
    insertTestResult: InsertTestResult,
  ): Promise<TestResult> {
    const id = randomUUID();
    const createdAt = new Date();
    const testResult: TestResult = {
      ...insertTestResult,
      id,
      createdAt,
      accuracyRate: insertTestResult.accuracyRate ?? null,
      processingTime: insertTestResult.processingTime ?? null,
      actionItemsFound: insertTestResult.actionItemsFound ?? null,
    };
    this.testResults.set(id, testResult);
    return testResult;
  }

  async getTestResultsByMeeting(meetingId: string): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(
      (result) => result.meetingId === meetingId,
    );
  }

  // User methods
  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();

    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      provider: insertUser.provider ?? "email",
      providerId: insertUser.providerId ?? null,
      isEmailVerified: insertUser.isEmailVerified ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, user);

    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Session methods
  async getSession(token: string): Promise<Session | undefined> {
    const session = this.sessions.get(token);
    if (!session) return undefined;

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return undefined;
    }

    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const createdAt = new Date();
    const session: Session = {
      ...insertSession,
      id,
      createdAt,
    };
    this.sessions.set(insertSession.token, session);
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    for (const [token, session] of Array.from(this.sessions.entries())) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
      }
    }
  }
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
  async getMeetings(limit = 50): Promise<Meeting[]> {
    return db
      .select()
      .from(meetings)
      .orderBy(desc(meetings.createdAt))
      .limit(limit);
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
  async getAllActionItems(limit = 50): Promise<ActionItem[]> {
    return db
      .select()
      .from(actionItems)
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
}

export const storage = new DrizzleStorage();
