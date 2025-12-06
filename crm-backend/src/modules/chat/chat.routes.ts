import { Router } from "express";
import {
  listConversationsHandler,
  listMessagesHandler,
  postMessageHandler,
  getConversationCustomerHandler,
  assignConversationHandler,markConversationRead
} from "./chat.controller";
import {getUnreadConversationCountForUser} from "./chat.service";
import { createTicketFromConversationHandler } from "../ticket/ticket.controller";
import { authRequired } from "../../middleware/auth";

const router = Router();

router.get("/conversations", authRequired, listConversationsHandler);
router.get("/conversations/:id/messages", authRequired, listMessagesHandler);
router.post("/conversations/:id/messages", authRequired, postMessageHandler);
router.patch("/conversations/:id/assign", authRequired, assignConversationHandler);
router.patch("/conversations/:id/unassign", authRequired, assignConversationHandler);
router.patch("/conversations/:id/read", authRequired, markConversationRead);

// Tạo ticket từ conversation 
router.post(
  "/conversations/:id/tickets",
  authRequired,
  createTicketFromConversationHandler
);

// get unreadConversation for assignee
router.get(
  "/conversations/unread-count",
  authRequired,
  async (req: any, res) => {
    try {
      const userId = req.user.id; 
      const total = await getUnreadConversationCountForUser(userId);

      res.json({ total });
    } catch (err) {
      console.error("Error getUnreadConversationCount", err);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  }
);

router.get(
  "/conversations/:conversationId/customer",
  authRequired,
  getConversationCustomerHandler
);

export default router;
