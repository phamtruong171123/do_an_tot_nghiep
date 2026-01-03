import {Router} from "express";
import { getAdminDashboardHandler, getAgentDashboardHandler } from "./dashboard.controller";
import {authRequired} from "../../middleware/auth";


const router = Router();

router.get("/dashboard/agent", authRequired, getAgentDashboardHandler);
router.get("/dashboard/admin", authRequired, getAdminDashboardHandler);
export default router;