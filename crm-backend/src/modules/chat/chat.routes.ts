import { Router } from "express";
import {
  listConversationsHandler,
  listMessagesHandler,
  postMessageHandler,
  assignConversationHandler,
} from "./chat.controller";
import { createTicketFromConversationHandler } from "../ticket/ticket.controller";
import { authRequired } from "../../middleware/auth";

const router = Router();

router.get("/conversations", authRequired, listConversationsHandler);
router.get("/conversations/:id/messages", authRequired, listMessagesHandler);
router.post("/conversations/:id/messages", authRequired, postMessageHandler);
router.patch("/conversations/:id/assign", authRequired, assignConversationHandler);

// Tạo ticket từ conversation 
router.post(
  "/conversations/:id/tickets",
  authRequired,
  createTicketFromConversationHandler
);

export default router;
