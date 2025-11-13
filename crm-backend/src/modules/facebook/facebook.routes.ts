import { Router } from "express";
import { verifyWebhook, receiveWebhook, sendMessage } from "./facebook.controller";

const router = Router();

// Facebook webhook (verify + receive)
router.get("/webhook", verifyWebhook);
router.post("/webhook", receiveWebhook);


router.post("/send", sendMessage);

export default router;
