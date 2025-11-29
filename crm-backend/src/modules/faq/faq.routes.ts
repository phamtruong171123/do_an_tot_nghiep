import { Router } from "express";
import { authRequired, adminOnly } from "../../middleware/auth";
import {
  listFaqsHandler,
  getFaqHandler,
  createFaqHandler,
  updateFaqHandler,
  deleteFaqHandler,
} from "./faq.controller";

const router = Router();

// Admin manage FAQ
router.get("/", authRequired, listFaqsHandler);
router.get("/:id", authRequired, getFaqHandler);
router.post("/", authRequired, adminOnly, createFaqHandler);
router.put("/:id", authRequired, adminOnly, updateFaqHandler);
router.delete("/:id", authRequired, adminOnly, deleteFaqHandler);

export default router;
