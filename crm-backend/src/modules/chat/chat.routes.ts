import { Router } from "express";
import {
  listConversationsHandler,
  listMessagesHandler,
  postMessageHandler,
  assignConversationHandler,
  markConversationRead,
} from "./chat.controller";

const router = Router();

router.get("/conversations", listConversationsHandler);
router.get("/conversations/:id/messages", listMessagesHandler);
router.post("/conversations/:id/messages", postMessageHandler);
router.patch("/conversations/:id/assign", assignConversationHandler);
router.patch("/conversations/:id/read", markConversationRead);

export default router;
