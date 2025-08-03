import { type Question, type InsertQuestion, type EventSettings, type InsertEventSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestionStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<Question | undefined>;
  likeQuestion(id: string, userId: string): Promise<Question | undefined>;
  getQuestionsByStatus(status: "pending" | "approved" | "rejected"): Promise<Question[]>;
  clearQuestions(): Promise<void>;
  trackUser(userId: string): void;
  removeUser(userId: string): void;
  clearAllUsers(): void;
  syncActiveUsers(connectedUserIds: string[]): void;
  getUniqueParticipantCount(): number;
  getEventSettings(): Promise<EventSettings>;
  updateEventSettings(settings: InsertEventSettings): Promise<EventSettings>;
}

export class MemStorage implements IStorage {
  private questions: Map<string, Question>;
  private activeUsers: Set<string> = new Set(); // Track unique user IDs
  private eventSettings: EventSettings;
  private nextId: number = 1;

  constructor() {
    this.questions = new Map();
    this.eventSettings = {
      id: "default",
      title: "Learn & Build with AI",
      subtitle: "Live Q&A Session",
      updatedAt: new Date(),
    };
  }

  // Track unique user activity
  trackUser(userId: string): void {
    this.activeUsers.add(userId);
  }

  removeUser(userId: string): void {
    this.activeUsers.delete(userId);
  }

  // Clean up all active users (useful for resetting state)
  clearAllUsers(): void {
    this.activeUsers.clear();
  }

  // Sync active users with actually connected users
  syncActiveUsers(connectedUserIds: string[]): void {
    this.activeUsers.clear();
    connectedUserIds.forEach(userId => this.activeUsers.add(userId));
  }

  getUniqueParticipantCount(): number {
    return this.activeUsers.size;
  }

  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      ...insertQuestion,
      id,
      author: insertQuestion.author || "Anonymous",
      status: "approved", // Auto-approve all questions
      likes: 0,
      likedBy: [],
      createdAt: new Date(),
    };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestionStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, status };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async likeQuestion(id: string, userId: string): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    // Check if user has already liked this question
    const likedBy = question.likedBy || [];
    const hasLiked = likedBy.includes(userId);
    
    let updatedQuestion: Question;
    
    if (hasLiked) {
      // Unlike: remove user from likedBy and decrease likes
      updatedQuestion = { 
        ...question, 
        likes: Math.max(0, (question.likes || 0) - 1),
        likedBy: likedBy.filter(id => id !== userId)
      };
    } else {
      // Like: add user to likedBy and increase likes
      updatedQuestion = { 
        ...question, 
        likes: (question.likes || 0) + 1,
        likedBy: [...likedBy, userId]
      };
    }
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async getQuestionsByStatus(status: "pending" | "approved" | "rejected"): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.status === status)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async clearQuestions(): Promise<void> {
    this.questions.clear();
  }

  async getEventSettings(): Promise<EventSettings> {
    return this.eventSettings;
  }

  async updateEventSettings(settings: InsertEventSettings): Promise<EventSettings> {
    this.eventSettings = {
      ...this.eventSettings,
      ...settings,
      updatedAt: new Date(),
    };
    return this.eventSettings;
  }
}

export const storage = new MemStorage();
