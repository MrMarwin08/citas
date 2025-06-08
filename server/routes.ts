import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertQuoteSchema, insertUserQuoteSchema, insertCollectionSchema, insertCollectionQuoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.patch("/api/users/:id", async (req, res) => {
    const userId = Number(req.params.id);
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Actualizamos solo los datos básicos permitidos: fullName y profilePicture
      const updateData = {
        fullName: req.body.fullName,
        profilePicture: req.body.profilePicture
      };
      
      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user data" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedUser = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedUser);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id/preferences", async (req, res) => {
    const userId = Number(req.params.id);
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUserPreferences(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quote routes
  app.get("/api/quotes", async (req, res) => {
    const { category } = req.query;
    let quotes;
    
    if (category) {
      quotes = await storage.getQuotesByCategory(category as string);
    } else {
      quotes = await storage.getAllQuotes();
    }
    
    res.json(quotes);
  });

  app.get("/api/quotes/random", async (req, res) => {
    const { category } = req.query;
    let quote;
    
    if (category) {
      quote = await storage.getRandomQuoteByCategory(category as string);
    } else {
      quote = await storage.getRandomQuote();
    }
    
    if (!quote) {
      return res.status(404).json({ message: "No quotes found" });
    }
    
    res.json(quote);
  });

  app.get("/api/quotes/daily", async (req, res) => {
    const quote = await storage.getDailyGlobalQuote();
    if (!quote) {
      return res.status(404).json({ message: "Daily quote not found" });
    }
    res.json(quote);
  });

  app.get("/api/quotes/personalized/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const quote = await storage.getPersonalizedQuote(userId);
    if (!quote) {
      return res.status(404).json({ message: "No personalized quote found" });
    }
    
    res.json(quote);
  });

  // UserQuote routes
  app.get("/api/users/:id/quotes", async (req, res) => {
    const userId = Number(req.params.id);
    const filter = req.query.filter as 'all' | 'favorites' | 'memorized' || 'all';
    
    const userQuotes = await storage.getUserQuotesFiltered(userId, filter);
    res.json(userQuotes);
  });

  app.post("/api/users/:id/quotes", async (req, res) => {
    const userId = Number(req.params.id);
    
    try {
      const validatedUserQuote = insertUserQuoteSchema.parse({
        ...req.body,
        userId
      });
      
      const userQuote = await storage.saveQuote(validatedUserQuote);
      res.status(201).json(userQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:userId/quotes/:quoteId/favorite", async (req, res) => {
    const userId = Number(req.params.userId);
    const quoteId = Number(req.params.quoteId);
    
    const userQuote = await storage.toggleFavorite(userId, quoteId);
    res.json(userQuote);
  });

  app.post("/api/users/:userId/quotes/:quoteId/memorize", async (req, res) => {
    const userId = Number(req.params.userId);
    const quoteId = Number(req.params.quoteId);
    
    const userQuote = await storage.toggleMemorized(userId, quoteId);
    res.json(userQuote);
  });

  // Delete user quote route (permanent deletion from all tabs)
  app.delete("/api/users/:userId/quotes/:quoteId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const quoteId = Number(req.params.quoteId);
      
      const success = await storage.deleteUserQuote(userId, quoteId);
      if (success) {
        res.json({ message: "Quote deleted successfully" });
      } else {
        res.status(404).json({ message: "Quote not found" });
      }
    } catch (error) {
      console.error("Error deleting user quote:", error);
      res.status(500).json({ message: "Error deleting quote" });
    }
  });

  // Remove quote from favorites only
  app.delete("/api/users/:userId/quotes/:quoteId/favorites", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const quoteId = Number(req.params.quoteId);
      
      const result = await storage.removeFromFavorites(userId, quoteId);
      if (result) {
        res.json({ message: "Quote removed from favorites successfully" });
      } else {
        res.status(404).json({ message: "Quote not found in favorites" });
      }
    } catch (error) {
      console.error("Error removing quote from favorites:", error);
      res.status(500).json({ message: "Error removing quote from favorites" });
    }
  });

  // Remove quote from memorized only
  app.delete("/api/users/:userId/quotes/:quoteId/memorized", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const quoteId = Number(req.params.quoteId);
      
      const result = await storage.removeFromMemorized(userId, quoteId);
      if (result) {
        res.json({ message: "Quote removed from memorized successfully" });
      } else {
        res.status(404).json({ message: "Quote not found in memorized" });
      }
    } catch (error) {
      console.error("Error removing quote from memorized:", error);
      res.status(500).json({ message: "Error removing quote from memorized" });
    }
  });

  // Reorder user quotes
  app.patch("/api/users/:userId/quotes/:quoteId/reorder", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const quoteId = Number(req.params.quoteId);
      const { newPosition, filter } = req.body;
      
      if (!newPosition || newPosition < 1) {
        return res.status(400).json({ message: "Invalid position" });
      }
      
      const success = await storage.reorderUserQuotes(userId, quoteId, newPosition, filter);
      if (success) {
        res.json({ message: "Quote reordered successfully" });
      } else {
        res.status(404).json({ message: "Quote not found or reorder failed" });
      }
    } catch (error) {
      console.error("Error reordering user quote:", error);
      res.status(500).json({ message: "Error reordering quote" });
    }
  });

  // Collection routes
  app.get("/api/users/:userId/collections", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const collections = await storage.getUserCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Error fetching collections" });
    }
  });

  app.post("/api/users/:userId/collections", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const validatedCollection = insertCollectionSchema.parse({
        ...req.body,
        userId
      });
      const collection = await storage.createCollection(validatedCollection);
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating collection" });
    }
  });

  app.patch("/api/users/:userId/collections/:collectionId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const collectionId = Number(req.params.collectionId);
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Collection name is required" });
      }
      
      const success = await storage.updateCollection(userId, collectionId, { name: name.trim() });
      if (success) {
        res.json(success);
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Error updating collection" });
    }
  });

  app.delete("/api/users/:userId/collections/:collectionId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const collectionId = Number(req.params.collectionId);
      
      const success = await storage.deleteCollection(userId, collectionId);
      if (success) {
        res.json({ message: "Collection deleted successfully" });
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Error deleting collection" });
    }
  });

  app.get("/api/collections/:collectionId/quotes", async (req, res) => {
    try {
      const collectionId = Number(req.params.collectionId);
      const quotes = await storage.getCollectionQuotes(collectionId);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching collection quotes:", error);
      res.status(500).json({ message: "Error fetching collection quotes" });
    }
  });

  app.post("/api/collections/:collectionId/quotes", async (req, res) => {
    try {
      const collectionId = Number(req.params.collectionId);
      const validatedCollectionQuote = insertCollectionQuoteSchema.parse({
        ...req.body,
        collectionId
      });
      const collectionQuote = await storage.addQuoteToCollection(validatedCollectionQuote);
      res.status(201).json(collectionQuote);
    } catch (error) {
      console.error("Error adding quote to collection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error adding quote to collection" });
    }
  });

  app.delete("/api/collections/:collectionId/quotes/:quoteId", async (req, res) => {
    try {
      const collectionId = Number(req.params.collectionId);
      const quoteId = Number(req.params.quoteId);
      
      const success = await storage.removeQuoteFromCollection(collectionId, quoteId);
      if (success) {
        res.json({ message: "Quote removed from collection successfully" });
      } else {
        res.status(404).json({ message: "Quote not found in collection" });
      }
    } catch (error) {
      console.error("Error removing quote from collection:", error);
      res.status(500).json({ message: "Error removing quote from collection" });
    }
  });

  // Reorder collection quotes
  app.patch("/api/collections/:collectionId/quotes/:quoteId/reorder", async (req, res) => {
    try {
      const collectionId = Number(req.params.collectionId);
      const quoteId = Number(req.params.quoteId);
      const { newPosition } = req.body;
      
      if (!newPosition || newPosition < 1) {
        return res.status(400).json({ message: "Invalid position" });
      }
      
      const success = await storage.reorderCollectionQuotes(collectionId, quoteId, newPosition);
      if (success) {
        res.json({ message: "Quote reordered successfully" });
      } else {
        res.status(404).json({ message: "Quote not found or reorder failed" });
      }
    } catch (error) {
      console.error("Error reordering collection quote:", error);
      res.status(500).json({ message: "Error reordering quote" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
