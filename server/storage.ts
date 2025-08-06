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
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
