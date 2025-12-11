import { Router } from "express";
import { login, refresh, logout } from "./auth.controller";
import { authRequired } from "../../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authRequired, logout);

export default router;
