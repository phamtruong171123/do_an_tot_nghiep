import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import presenceRoutes from "./modules/presence/presence.routes";
import facebookRoutes from "./modules/facebook/facebook.routes";
import chatRouter from "./modules/chat/chat.routes";
import ticketRoutes from "./modules/ticket/ticket.routes";
import customerRoutes from "./modules/customer/customer.routes";
import faqRoutes from "./modules/faq/faq.routes";
import aiSuggestionRoutes from "./modules/ai/aiSuggestion.routes";
import dealRoutes from "./modules/deal/deal.routes";
import gptConfigRoutes from "./modules/gptConfig/gptConfig.routes";
import { getRecentDealsOfCustomer } from "./modules/deal/deal.controller";

const ALLOWED_ORIGINS = ["http://localhost:3000"];

export const app = express();
app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.get("/api/customers/:customerId/recent-deals", getRecentDealsOfCustomer);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", presenceRoutes);
app.use("/api/facebook", facebookRoutes);
app.use("/api/chat", chatRouter);
app.use("/api/tickets", ticketRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/ai", aiSuggestionRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/gpt-config", gptConfigRoutes);

const PORT = Number(process.env.PORT ?? 4000);
