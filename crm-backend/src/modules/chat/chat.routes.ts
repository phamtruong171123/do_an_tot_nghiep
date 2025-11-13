import { Router } from "express";
import {
  listConversationsHandler,
  listMessagesHandler,
  postMessageHandler,
  assignConversationHandler,
} from "./chat.controller";

const router = Router();

router.get("/conversations", listConversationsHandler);
router.get("/conversations/:id/messages", listMessagesHandler);
router.post("/conversations/:id/messages", postMessageHandler);
router.patch("/conversations/:id/assign", assignConversationHandler);

export default router;
