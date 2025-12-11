import { Router } from "express";
import { authRequired } from "../../middleware/auth";
import { suggestFromFaqHandler } from "./aiSuggestion.controller";

const router = Router();

router.post("/suggestions", authRequired, suggestFromFaqHandler);

export default router;
