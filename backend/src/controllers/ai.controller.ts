import { Request, Response } from "express";
import {
  getMessageSuggestions,
  detectMood,
  improveCaption,
} from "../services/ai.service";

export const suggestReplies = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }
    const suggestions = await getMessageSuggestions(messages);
    res.json({ suggestions });
  } catch (err) {
    console.error("AI suggestions error:", err);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
};

export const moodDetect = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }
    const mood = await detectMood(messages);
    res.json(mood);
  } catch (err) {
    console.error("Mood detection error:", err);
    res.status(500).json({ error: "Failed to detect mood" });
  }
};

export const captionImprove = async (req: Request, res: Response) => {
  try {
    const { caption, mood } = req.body;
    if (!caption || typeof caption !== "string") {
      return res.status(400).json({ error: "caption string is required" });
    }
    const result = await improveCaption(caption, mood);
    res.json(result);
  } catch (err) {
    console.error("Caption improve error:", err);
    res.status(500).json({ error: "Failed to improve caption" });
  }
};