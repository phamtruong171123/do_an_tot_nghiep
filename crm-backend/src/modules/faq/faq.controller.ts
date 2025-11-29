import { Request, Response } from "express";
import {
  listFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
} from "./faq.service";

export async function listFaqsHandler(req: Request, res: Response) {
  const keyword = req.query.keyword as string | undefined;
  const isActive =
    typeof req.query.isActive === "string"
      ? req.query.isActive === "true"
      : undefined;

  const faqs = await listFaqs({ keyword, isActive });
  return res.json(faqs);
}

export async function getFaqHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const faq = await getFaq(id);
  if (!faq) return res.status(404).json({ message: "FAQ not found" });

  return res.json(faq);
}

export async function createFaqHandler(req: Request, res: Response) {
  const { question, answer, tags, language, isActive } = req.body || {};

  if (!question || !answer) {
    return res
      .status(400)
      .json({ message: "question and answer are required" });
  }

  const created = await createFaq({
    question,
    answer,
    tags,
    language,
    isActive,
  });

  return res.status(201).json(created);
}

export async function updateFaqHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const { question, answer, tags, language, isActive } = req.body || {};

  if (!question || !answer) {
    return res
      .status(400)
      .json({ message: "question and answer are required" });
  }

  const updated = await updateFaq(id, {
    question,
    answer,
    tags,
    language,
    isActive,
  });

  return res.json(updated);
}

export async function deleteFaqHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  await deleteFaq(id);
  return res.json({ success: true });
}
