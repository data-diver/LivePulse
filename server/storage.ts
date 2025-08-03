import { type Question, type InsertQuestion } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestionStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<Question | undefined>;
  likeQuestion(id: string, userId: string): Promise<Question | undefined>;
  getQuestionsByStatus(status: "pending" | "approved" | "rejected"): Promise<Question[]>;
}

export class MemStorage implements IStorage {
  private questions: Map<string, Question>;
  private nextId: number = 1;

  constructor() {
    this.questions = new Map();
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
}

export const storage = new MemStorage();
