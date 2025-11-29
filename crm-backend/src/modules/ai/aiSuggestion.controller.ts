import { Request, Response } from "express";
import { generateSuggestionFromFaq } from "./aiSuggestion.service";

export async function suggestFromFaqHandler(req: Request, res: Response) {
  const { text } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ message: "text is required" });
  }

  const result = await generateSuggestionFromFaq(text);
  return res.json(result);
}
