import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertQuestionSchema, insertEventSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients with user tracking
  const clients = new Set<WebSocket>();
  const userConnections = new Map<string, Set<WebSocket>>(); // userId -> Set of WebSocket connections
  const socketToUser = new Map<WebSocket, string>(); // WebSocket -> userId mapping

  // Sync storage with actual connected users every 30 seconds to prevent phantom participants
  const syncInterval = setInterval(() => {
    const actualConnectedUsers = Array.from(userConnections.keys());
    storage.syncActiveUsers(actualConnectedUsers);
    console.log(`Synced participants. Current count: ${storage.getUniqueParticipantCount()}`);
    
    // Broadcast updated count if needed
    broadcast({
      type: 'participant_count_updated',
      count: storage.getUniqueParticipantCount()
    });
  }, 30000);
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total clients:', clients.size);
    
    // Handle messages from client (including user identification)
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'identify' && message.userId) {
          // Track this user
          storage.trackUser(message.userId);
          
          // Associate this WebSocket with the user
          if (!userConnections.has(message.userId)) {
            userConnections.set(message.userId, new Set());
          }
          userConnections.get(message.userId)!.add(ws);
          socketToUser.set(ws, message.userId);
          
          console.log(`User ${message.userId} identified. Unique participants: ${storage.getUniqueParticipantCount()}`);
          
          // Immediate sync to ensure storage matches reality
          const actualConnectedUsers = Array.from(userConnections.keys());
          storage.syncActiveUsers(actualConnectedUsers);
          
          // Broadcast updated participant count to all clients
          broadcast({
            type: 'participant_count_updated',
            count: storage.getUniqueParticipantCount()
          });
          
          console.log(`User ${message.userId} identified. Synced participants: ${storage.getUniqueParticipantCount()}`);
        } else if (message.type === 'request_participant_count') {
          // Send current participant count to this client
          ws.send(JSON.stringify({
            type: 'participant_count_updated',
            count: storage.getUniqueParticipantCount()
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      
      // Remove this WebSocket from user connections
      let participantCountChanged = false;
      const userId = socketToUser.get(ws);
      
      if (userId) {
        socketToUser.delete(ws);
        const userWs = userConnections.get(userId);
        if (userWs) {
          userWs.delete(ws);
          if (userWs.size === 0) {
            userConnections.delete(userId);
            storage.removeUser(userId);
            participantCountChanged = true;
            console.log(`User ${userId} fully disconnected. Unique participants: ${storage.getUniqueParticipantCount()}`);
          }
        }
      }
      
      console.log('Client disconnected. Total clients:', clients.size);
      
      // Immediate sync after any disconnection to prevent phantoms
      const actualConnectedUsers = Array.from(userConnections.keys());
      storage.syncActiveUsers(actualConnectedUsers);
      
      // Broadcast updated participant count if a unique user disconnected or sync changed count
      if (participantCountChanged) {
        broadcast({
          type: 'participant_count_updated',
          count: storage.getUniqueParticipantCount()
        });
        console.log(`User disconnected. Synced participants: ${storage.getUniqueParticipantCount()}`);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
      
      // Also clean up user tracking on error
      const userId = socketToUser.get(ws);
      if (userId) {
        socketToUser.delete(ws);
        const userWs = userConnections.get(userId);
        if (userWs) {
          userWs.delete(ws);
          if (userWs.size === 0) {
            userConnections.delete(userId);
            storage.removeUser(userId);
            broadcast({
              type: 'participant_count_updated',
              count: storage.getUniqueParticipantCount()
            });
          }
        }
      }
    });
  });
  
  // Broadcast to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Get all questions
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get approved questions only
  app.get("/api/questions/approved", async (req, res) => {
    try {
      const questions = await storage.getQuestionsByStatus("approved");
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approved questions" });
    }
  });

  // Get pending questions (admin only)
  app.get("/api/questions/pending", async (req, res) => {
    try {
      const questions = await storage.getQuestionsByStatus("pending");
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending questions" });
    }
  });

  // Submit a new question
  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      
      // Track user activity (using a simple user ID from client)
      const userId = req.headers['x-user-id'] as string || 'anonymous';
      storage.trackUser(userId);
      const question = await storage.createQuestion(validatedData);
      
      // Broadcast new question to all clients
      broadcast({
        type: 'new_question',
        question
      });
      
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid question data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create question" });
      }
    }
  });

  // Update question status (approve/reject)
  app.patch("/api/questions/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const question = await storage.updateQuestionStatus(id, status);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Broadcast status update to all clients
      broadcast({
        type: 'question_status_updated',
        question
      });
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to update question status" });
    }
  });

  // Like a question
  app.post("/api/questions/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Track user activity
      storage.trackUser(userId);
      
      const question = await storage.likeQuestion(id, userId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Broadcast like update to all clients
      broadcast({
        type: 'question_liked',
        question
      });
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to like question" });
    }
  });

  // Get stats for admin dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const allQuestions = await storage.getQuestions();
      const pending = allQuestions.filter(q => q.status === "pending").length;
      const approved = allQuestions.filter(q => q.status === "approved").length;
      const rejected = allQuestions.filter(q => q.status === "rejected").length;
      
      res.json({
        totalQuestions: allQuestions.length,
        pendingQuestions: pending,
        approvedQuestions: approved,
        rejectedQuestions: rejected,
        activeUsers: storage.getUniqueParticipantCount()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get event settings
  app.get("/api/event-settings", async (req, res) => {
    try {
      const settings = await storage.getEventSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event settings" });
    }
  });

  // Update event settings
  app.put("/api/event-settings", async (req, res) => {
    try {
      const validatedData = insertEventSettingsSchema.parse(req.body);
      const settings = await storage.updateEventSettings(validatedData);
      
      // Broadcast event settings update to all clients
      broadcast({
        type: 'event_settings_updated',
        settings
      });
      
      res.json(settings);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ message: "Validation error", errors: error });
      }
      res.status(500).json({ message: "Failed to update event settings" });
    }
  });

  // Clear all questions
  app.delete("/api/questions", async (req, res) => {
    try {
      await storage.clearQuestions();
      
      // Broadcast question clear to all clients
      broadcast({
        type: 'questions_cleared'
      });
      
      res.json({ message: "All questions cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear questions" });
    }
  });

  return httpServer;
}
